import { timingSafeEqual } from 'crypto';
import type { Request, Response } from 'express';
import * as admin from 'firebase-admin';
import { requireUid } from './authUtil';

const ENTITLEMENT_PRO = 'occasio_pro';
const WISH_CREDIT_PRODUCT_IDS = ['occasio_wish_single', 'single_wish'];

export type BillingState = {
  tier: 'free' | 'personal';
  creditsPurchased: number;
};

type RcSubscriber = {
  entitlements?: Record<string, { expires_date?: string | null }>;
  non_subscriptions?: Record<string, unknown[]>;
};

/**
 * RevenueCat is the source of truth. Tier and credits are written here, never
 * by the client, so a modified app cannot grant itself a paid plan.
 */
export async function fetchBillingState(
  uid: string,
  now = new Date(),
): Promise<BillingState> {
  const secret = process.env.REVENUECAT_SECRET_KEY;
  if (!secret) {
    throw new Error('revenuecat_not_configured');
  }
  const res = await fetch(
    `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(uid)}`,
    { headers: { Authorization: `Bearer ${secret}` } },
  );
  if (!res.ok) {
    throw new Error(`revenuecat_${res.status}`);
  }
  const body = (await res.json()) as { subscriber?: RcSubscriber };
  return billingStateFromSubscriber(body.subscriber ?? {}, now);
}

export function billingStateFromSubscriber(
  subscriber: RcSubscriber,
  now: Date,
): BillingState {
  const pro = subscriber.entitlements?.[ENTITLEMENT_PRO];
  const expires = pro?.expires_date ? new Date(pro.expires_date) : null;
  const proActive = Boolean(pro) && (expires === null || expires > now);

  let creditsPurchased = 0;
  for (const productId of WISH_CREDIT_PRODUCT_IDS) {
    const purchases = subscriber.non_subscriptions?.[productId];
    if (Array.isArray(purchases)) {
      creditsPurchased += purchases.length;
    }
  }
  return { tier: proActive ? 'personal' : 'free', creditsPurchased };
}

export async function syncUserBilling(
  db: FirebaseFirestore.Firestore,
  uid: string,
): Promise<BillingState & { creditsAvailable: number }> {
  const state = await fetchBillingState(uid);
  const ref = db.collection('users').doc(uid);
  await ref.set(
    {
      subscriptionTier: state.tier,
      wishCreditsPurchased: state.creditsPurchased,
      billingSyncedAt: admin.firestore.Timestamp.now(),
    },
    { merge: true },
  );
  const used = Number((await ref.get()).data()?.wishCreditsUsed ?? 0);
  return {
    ...state,
    creditsAvailable: Math.max(0, state.creditsPurchased - Math.max(0, used)),
  };
}

function billingFailure(res: Response, error: unknown): void {
  const message = error instanceof Error ? error.message : 'unknown';
  console.error('billing sync failed', message);
  if (message === 'revenuecat_not_configured') {
    res.status(503).json({ code: 'BILLING_NOT_CONFIGURED' });
    return;
  }
  res.status(502).json({ code: 'BILLING_UPSTREAM' });
}

export async function handleBillingSync(
  req: Request,
  res: Response,
  db: FirebaseFirestore.Firestore,
  auth: admin.auth.Auth,
): Promise<void> {
  const uid = await requireUid(req, auth);
  if (!uid) {
    res.status(401).json({ code: 'UNAUTHORIZED' });
    return;
  }
  try {
    const state = await syncUserBilling(db, uid);
    res.status(200).json({ ok: true, ...state });
  } catch (error) {
    billingFailure(res, error);
  }
}

/** Spend one purchased single-wish credit, atomically and server-verified. */
export async function handleConsumeCredit(
  req: Request,
  res: Response,
  db: FirebaseFirestore.Firestore,
  auth: admin.auth.Auth,
): Promise<void> {
  const uid = await requireUid(req, auth);
  if (!uid) {
    res.status(401).json({ code: 'UNAUTHORIZED' });
    return;
  }
  try {
    const { creditsPurchased } = await fetchBillingState(uid);
    const ref = db.collection('users').doc(uid);
    const ok = await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const used = Math.max(0, Number(snap.data()?.wishCreditsUsed ?? 0));
      if (creditsPurchased - used <= 0) {
        return false;
      }
      tx.set(ref, { wishCreditsUsed: used + 1 }, { merge: true });
      return true;
    });
    if (!ok) {
      res.status(402).json({ code: 'QUOTA_EXCEEDED' });
      return;
    }
    res.status(200).json({ ok: true });
  } catch (error) {
    billingFailure(res, error);
  }
}

function secretMatches(header: string | undefined, expected: string): boolean {
  if (!header) {
    return false;
  }
  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** RevenueCat webhook: set the same secret as the "Authorization" header value in the dashboard. */
export async function handleRevenueCatWebhook(
  req: Request,
  res: Response,
  db: FirebaseFirestore.Firestore,
): Promise<void> {
  const expected = process.env.OCCASIO_RC_WEBHOOK_AUTH;
  if (!expected) {
    res.status(503).json({ code: 'WEBHOOK_NOT_CONFIGURED' });
    return;
  }
  if (!secretMatches(req.header('authorization'), expected)) {
    res.status(401).json({ code: 'UNAUTHORIZED' });
    return;
  }
  const uid = (req.body as { event?: { app_user_id?: unknown } } | undefined)
    ?.event?.app_user_id;
  if (typeof uid !== 'string' || !uid || uid.startsWith('$RCAnonymousID')) {
    res.status(200).json({ ok: true, ignored: true });
    return;
  }
  try {
    await syncUserBilling(db, uid);
    res.status(200).json({ ok: true });
  } catch (error) {
    billingFailure(res, error);
  }
}
