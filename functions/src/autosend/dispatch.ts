import * as admin from 'firebase-admin';
import { pruneFcmTokens, sendAutosendSent } from './fcm';
import {
  channelDestinations,
  mockDeliveryProviders,
  type DeliveryProvider,
} from './providers';
import {
  isAutosendDispatchEnabled,
  type DeliveryChannel,
  type OccasionType,
  type ScheduledSendStatus,
} from './types';

const SCHEDULED_SENDS = 'scheduled_sends';

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
  providers: DeliveryProvider[] = mockDeliveryProviders(),
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

  const relationshipId = asString(data.relationshipId);
  const relSnap = relationshipId
    ? await db.collection('relationships').doc(relationshipId).get()
    : null;
  const contactRaw = relSnap?.data()?.contactChannel;
  const contact =
    contactRaw && typeof contactRaw === 'object'
      ? (contactRaw as { whatsapp?: unknown; phone?: unknown; email?: unknown })
      : {};
  const destinations = channelDestinations(contact);
  const personName = asString(data.personName);
  const occasionType = asString(data.occasionType) || 'birthday';
  const userId = asString(data.userId);

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
  await sendRef.update({
    status: 'failed',
    lastError: failError,
    updatedAt: nowTs,
  });
  return {
    status: 'failed',
    shareUrl,
    deliveryChannelUsed: null,
    lastError: failError,
  };
}
