import type * as admin from 'firebase-admin';
import { composeEmail } from './email/compose';
import { transactionalConfigFromEnv } from './email/config';
import { sendViaResend } from './email/resend';
import {
  subscriptionConfirmationEmail,
  type SubscriptionReceipt,
} from './email/templates';

const RECEIPTS = 'email_receipts';
const WISH_CREDIT_PRODUCTS = ['occasio_wish_single', 'single_wish'];

type RcEvent = {
  id?: unknown;
  type?: unknown;
  product_id?: unknown;
  period_type?: unknown;
  store?: unknown;
  currency?: unknown;
  price?: unknown;
  price_in_purchased_currency?: unknown;
  purchased_at_ms?: unknown;
  expiration_at_ms?: unknown;
};

function num(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function intervalFrom(event: RcEvent): SubscriptionReceipt['interval'] {
  const product = String(event.product_id ?? '').toLowerCase();
  if (/year|annual/.test(product)) return 'yearly';
  if (/month/.test(product)) return 'monthly';
  const start = num(event.purchased_at_ms);
  const end = num(event.expiration_at_ms);
  if (start !== null && end !== null) {
    const days = (end - start) / 86_400_000;
    if (days > 300) return 'yearly';
    if (days > 20) return 'monthly';
  }
  return null;
}

function amountText(event: RcEvent): string | null {
  const currency = typeof event.currency === 'string' ? event.currency : 'USD';
  const value = num(event.price_in_purchased_currency) ?? num(event.price);
  if (value === null || value <= 0) return null;
  try {
    return new Intl.NumberFormat('en', { style: 'currency', currency }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}

/** Turns a RevenueCat webhook event into receipt facts, or `null` when no email is due. */
export function receiptFromEvent(event: RcEvent): SubscriptionReceipt | null {
  if (event.type !== 'INITIAL_PURCHASE') return null;
  const product = String(event.product_id ?? '');
  if (!product || WISH_CREDIT_PRODUCTS.includes(product)) return null;

  const expires = num(event.expiration_at_ms);
  const store = event.store === 'APP_STORE' || event.store === 'MAC_APP_STORE'
    ? 'ios'
    : event.store === 'PLAY_STORE'
      ? 'android'
      : 'other';
  return {
    productName: 'Occasio Pro',
    interval: intervalFrom(event),
    amount: amountText(event),
    renewsOn: expires === null ? null : new Date(expires),
    isTrial: event.period_type === 'TRIAL',
    store,
  };
}

/**
 * Sends the purchase confirmation once per webhook event. Best effort: a failure
 * here is logged and never fails the webhook, because billing sync matters more.
 */
export async function sendSubscriptionConfirmation(
  db: FirebaseFirestore.Firestore,
  auth: admin.auth.Auth,
  uid: string,
  event: RcEvent,
  fetchImpl: typeof fetch = fetch,
): Promise<'sent' | 'skipped'> {
  const receipt = receiptFromEvent(event);
  const config = transactionalConfigFromEnv();
  const eventId = typeof event.id === 'string' ? event.id : '';
  if (!receipt || !config || !eventId) return 'skipped';

  try {
    // RevenueCat retries webhooks; creating this doc only works the first time.
    await db.collection(RECEIPTS).doc(eventId).create({ uid, at: new Date() });
  } catch {
    return 'skipped';
  }

  const email = (await auth.getUser(uid)).email;
  if (!email) return 'skipped';

  const body = subscriptionConfirmationEmail(receipt);
  const result = await sendViaResend(
    config.apiKey,
    composeEmail({
      kind: 'transactional',
      from: config.from,
      to: email,
      subject: body.subject,
      html: body.html,
      text: body.text,
    }),
    fetchImpl,
  );
  if (!result.ok) {
    console.error('subscription confirmation email failed', result.error);
    return 'skipped';
  }
  return 'sent';
}
