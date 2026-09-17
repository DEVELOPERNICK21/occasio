import * as admin from 'firebase-admin';
import type { OccasionType } from './types';

const INVALID_TOKEN_CODES = new Set([
  'messaging/invalid-registration-token',
  'messaging/registration-token-not-registered',
]);

export type AutosendReviewPayload = {
  sendId: string;
  personName: string;
  occasionType: OccasionType;
};

export async function sendAutosendReview(
  messaging: admin.messaging.Messaging,
  tokens: string[],
  payload: AutosendReviewPayload,
): Promise<string[]> {
  const unique = [...new Set(tokens.filter((token) => token.length > 0))];
  if (unique.length === 0) {
    return [];
  }

  const occasionLabel =
    payload.occasionType === 'anniversary' ? 'anniversary' : 'birthday';

  const response = await messaging.sendEachForMulticast({
    tokens: unique,
    notification: {
      title: `Review ${payload.personName}'s card`,
      body: `Their ${occasionLabel} is today. You have 24 hours to review.`,
    },
    data: {
      type: 'autosend_review',
      sendId: payload.sendId,
      personName: payload.personName,
      occasionType: payload.occasionType,
    },
  });

  const invalid: string[] = [];
  response.responses.forEach((result, index) => {
    const code = result.error?.code;
    if (code && INVALID_TOKEN_CODES.has(code)) {
      const token = unique[index];
      if (token) {
        invalid.push(token);
      }
    }
  });
  return invalid;
}

export type AutosendSentPayload = {
  sendId: string;
  personName: string;
  occasionType: OccasionType;
  shareUrl: string;
};

export async function sendAutosendSent(
  messaging: admin.messaging.Messaging,
  tokens: string[],
  payload: AutosendSentPayload,
): Promise<string[]> {
  const unique = [...new Set(tokens.filter((token) => token.length > 0))];
  if (unique.length === 0) {
    return [];
  }

  const response = await messaging.sendEachForMulticast({
    tokens: unique,
    notification: {
      title: `${payload.personName}'s card is ready`,
      body: 'Share the link from Vault if you want to send it yourself.',
    },
    data: {
      type: 'autosend_sent',
      sendId: payload.sendId,
      personName: payload.personName,
      occasionType: payload.occasionType,
      shareUrl: payload.shareUrl,
    },
  });

  const invalid: string[] = [];
  response.responses.forEach((result, index) => {
    const code = result.error?.code;
    if (code && INVALID_TOKEN_CODES.has(code)) {
      const token = unique[index];
      if (token) {
        invalid.push(token);
      }
    }
  });
  return invalid;
}

export async function pruneFcmTokens(
  db: FirebaseFirestore.Firestore,
  userId: string,
  invalidTokens: string[],
): Promise<void> {
  if (invalidTokens.length === 0) {
    return;
  }
  await db.collection('users').doc(userId).update({
    fcmTokens: admin.firestore.FieldValue.arrayRemove(...invalidTokens),
  });
}
