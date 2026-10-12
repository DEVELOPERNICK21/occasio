import * as admin from 'firebase-admin';
import { pruneFcmTokens, sendAutosendSent } from './fcm';
import {
  applyDeliveryConsent,
  channelDestinations,
  deliveryProviders,
  hasDeliverableChannel,
  type DeliveryProvider,
} from './providers';
import { verifyPaidAtSendTime, type SendTimeTierCheck } from './tier';
import {
  isAutosendDispatchEnabled,
  type DeliveryChannel,
  type OccasionType,
  type ScheduledSendStatus,
} from './types';

const SCHEDULED_SENDS = 'scheduled_sends';
const MAX_DISPATCH_ATTEMPTS = 3;
/** A claim older than this is treated as a crashed worker and may be retaken. */
const CLAIM_TTL_MS = 10 * 60 * 1000;

export type DispatchResult = {
  status: ScheduledSendStatus;
  shareUrl: string | null;
  deliveryChannelUsed: DeliveryChannel | null;
  lastError: string | null;
};

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === 'string');
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

export type ChannelAttemptResult = {
  used: DeliveryChannel | null;
  attempted: DeliveryChannel[];
  lastError: string | null;
};

export async function attemptChannels(
  providers: DeliveryProvider[],
  destinations: Record<DeliveryChannel, string>,
  payload: {
    shareUrl: string | null;
    personName: string;
    occasionType: string;
  },
): Promise<ChannelAttemptResult> {
  const attempted: DeliveryChannel[] = [];
  let lastError: string | null = null;

  for (const provider of providers) {
    attempted.push(provider.channel);
    if (!payload.shareUrl) {
      lastError = 'missing_share_url';
      continue;
    }
    const to = destinations[provider.channel];
    if (!to) {
      lastError = 'missing_contact';
      continue;
    }
    const result = await provider.send({
      to,
      shareUrl: payload.shareUrl,
      personName: payload.personName,
      occasionType: payload.occasionType,
    });
    if (result.ok) {
      return { used: provider.channel, attempted, lastError: null };
    }
    lastError = result.error;
  }

  return {
    used: null,
    attempted,
    lastError: lastError ?? 'all_channels_failed',
  };
}

/** Where this person agreed to receive cards. Empty strings mean "do not use". */
export async function loadDeliveryDestinations(
  db: FirebaseFirestore.Firestore,
  relationshipId: string,
): Promise<Record<DeliveryChannel, string>> {
  const relSnap = relationshipId
    ? await db.collection('relationships').doc(relationshipId).get()
    : null;
  const relData = relSnap?.data();
  const contactRaw = relData?.contactChannel;
  const contact =
    contactRaw && typeof contactRaw === 'object'
      ? (contactRaw as { whatsapp?: unknown; phone?: unknown; email?: unknown })
      : {};
  return applyDeliveryConsent(channelDestinations(contact), relData?.deliveryConsent);
}

async function notifySent(
  db: FirebaseFirestore.Firestore,
  messaging: admin.messaging.Messaging,
  userId: string,
  payload: {
    sendId: string;
    personName: string;
    occasionType: OccasionType;
    shareUrl: string;
  },
): Promise<void> {
  const snap = await db.collection('users').doc(userId).get();
  const tokens = stringArray(snap.data()?.fcmTokens);
  try {
    const invalid = await sendAutosendSent(messaging, tokens, payload);
    if (invalid.length === 0) {
      return;
    }
    await pruneFcmTokens(db, userId, invalid);
  } catch (error) {
    console.error('autosend sent FCM failed', error);
  }
}

export async function dispatchScheduledSend(
  db: FirebaseFirestore.Firestore,
  messaging: admin.messaging.Messaging,
  sendId: string,
  providers: DeliveryProvider[] = deliveryProviders(db),
  verifyTier: SendTimeTierCheck = verifyPaidAtSendTime,
): Promise<DispatchResult> {
  const sendRef = db.collection(SCHEDULED_SENDS).doc(sendId);
  const snap = await sendRef.get();
  if (!snap.exists) {
    return {
      status: 'failed',
      shareUrl: null,
      deliveryChannelUsed: null,
      lastError: 'not_found',
    };
  }

  const data = snap.data() ?? {};
  const status = data.status as ScheduledSendStatus | undefined;
  const shareUrl = asString(data.shareUrl) || null;
  const usedExisting =
    data.deliveryChannelUsed === 'whatsapp' ||
    data.deliveryChannelUsed === 'sms' ||
    data.deliveryChannelUsed === 'email'
      ? data.deliveryChannelUsed
      : null;

  if (status === 'sent' || status === 'cancelled' || status === 'failed') {
    return {
      status: status ?? 'failed',
      shareUrl,
      deliveryChannelUsed: usedExisting,
      lastError: typeof data.lastError === 'string' ? data.lastError : null,
    };
  }

  if (status !== 'approved') {
    return {
      status: status ?? 'failed',
      shareUrl,
      deliveryChannelUsed: usedExisting,
      lastError: typeof data.lastError === 'string' ? data.lastError : 'not_approved',
    };
  }

  if (!isAutosendDispatchEnabled()) {
    return {
      status: 'approved',
      shareUrl,
      deliveryChannelUsed: null,
      lastError: null,
    };
  }

  if (providers.length === 0) {
    console.error('AUTOSEND_NO_PROVIDERS', { sendId });
    await sendRef.update({
      lastError: 'no_providers',
      updatedAt: admin.firestore.Timestamp.now(),
    });
    return {
      status: 'approved',
      shareUrl,
      deliveryChannelUsed: null,
      lastError: 'no_providers',
    };
  }

  // No channel this person agreed to: the owner shares the link themselves.
  // That is a normal resting state, not a failure, so the sweep skips it.
  const destinations = await loadDeliveryDestinations(
    db,
    asString(data.relationshipId),
  );
  if (!hasDeliverableChannel(providers, destinations)) {
    if (data.manual !== true) {
      await sendRef.update({
        manual: true,
        lastError: null,
        updatedAt: admin.firestore.Timestamp.now(),
      });
    }
    return {
      status: 'approved',
      shareUrl,
      deliveryChannelUsed: null,
      lastError: null,
    };
  }

  // The plan is checked now, not when the send was scheduled: a lapsed or
  // refunded subscriber must not trigger delivery to someone else.
  const userId = asString(data.userId);
  const tier = await verifyTier(db, userId);
  if (tier === 'lapsed') {
    await sendRef.update({
      status: 'cancelled',
      lastError: 'subscription_inactive',
      dispatchClaimedAt: null,
      updatedAt: admin.firestore.Timestamp.now(),
    });
    return {
      status: 'cancelled',
      shareUrl,
      deliveryChannelUsed: null,
      lastError: 'subscription_inactive',
    };
  }
  if (tier === 'unknown') {
    // Stay approved; the 15-minute sweep asks again. Not counted as an attempt.
    await sendRef.update({
      lastError: 'billing_unavailable',
      updatedAt: admin.firestore.Timestamp.now(),
    });
    return {
      status: 'approved',
      shareUrl,
      deliveryChannelUsed: null,
      lastError: 'billing_unavailable',
    };
  }

  // Claim so a concurrent approve + sweep cannot deliver the same wish twice.
  const claimed = await db.runTransaction(async (tx) => {
    const fresh = await tx.get(sendRef);
    const freshData = fresh.data() ?? {};
    if (freshData.status !== 'approved') {
      return false;
    }
    const claimedAt = freshData.dispatchClaimedAt;
    const claimedMs =
      claimedAt && typeof claimedAt.toMillis === 'function'
        ? (claimedAt.toMillis() as number)
        : 0;
    if (claimedMs && Date.now() - claimedMs < CLAIM_TTL_MS) {
      return false;
    }
    tx.update(sendRef, { dispatchClaimedAt: admin.firestore.Timestamp.now() });
    return true;
  });
  if (!claimed) {
    return {
      status: 'approved',
      shareUrl,
      deliveryChannelUsed: null,
      lastError: null,
    };
  }

  const personName = asString(data.personName);
  const occasionType = asString(data.occasionType) || 'birthday';

  const attempt = await attemptChannels(providers, destinations, {
    shareUrl,
    personName,
    occasionType,
  });

  if (attempt.attempted.length > 0) {
    await sendRef.update({
      deliveryChannelAttempted: admin.firestore.FieldValue.arrayUnion(
        ...attempt.attempted,
      ),
      updatedAt: admin.firestore.Timestamp.now(),
    });
  }

  const deliveryChannelUsed = attempt.used;
  const lastError = attempt.lastError;
  const nowTs = admin.firestore.Timestamp.now();
  if (deliveryChannelUsed && shareUrl) {
    await sendRef.update({
      status: 'sent',
      deliveryChannelUsed,
      lastError: null,
      dispatchClaimedAt: null,
      updatedAt: nowTs,
    });
    if (userId) {
      await notifySent(db, messaging, userId, {
        sendId,
        personName,
        occasionType: occasionType === 'anniversary' ? 'anniversary' : 'birthday',
        shareUrl,
      });
    }
    return {
      status: 'sent',
      shareUrl,
      deliveryChannelUsed,
      lastError: null,
    };
  }

  const failError = lastError ?? 'all_channels_failed';
  const attempts =
    (typeof data.dispatchAttempts === 'number' ? data.dispatchAttempts : 0) + 1;
  const giveUp = attempts >= MAX_DISPATCH_ATTEMPTS;
  if (giveUp) {
    // Highest-severity failure class: point a Cloud Logging alert at this key.
    console.error('AUTOSEND_DELIVERY_FAILED', {
      sendId,
      userId,
      attempts,
      error: failError,
    });
  }
  await sendRef.update({
    // Stay `approved` so the 15-minute sweep retries until attempts run out.
    status: giveUp ? 'failed' : 'approved',
    lastError: failError,
    dispatchAttempts: attempts,
    dispatchClaimedAt: null,
    updatedAt: nowTs,
  });
  return {
    status: giveUp ? 'failed' : 'approved',
    shareUrl,
    deliveryChannelUsed: null,
    lastError: failError,
  };
}
