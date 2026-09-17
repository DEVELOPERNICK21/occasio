import firestore from '@react-native-firebase/firestore';
import messaging, { type FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import { env } from '../../../shared/config/env';
import { isFirebaseConfigured } from '../../../shared/firebase/app';

export type AutosendNotificationPayload = {
  type: 'autosend_review' | 'autosend_sent';
  sendId: string;
  shareUrl?: string;
};

function stringData(
  data: FirebaseMessagingTypes.RemoteMessage['data'] | Record<string, string> | undefined,
): Record<string, string> {
  if (!data) {
    return {};
  }
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      out[key] = value;
    }
  }
  return out;
}

export function parseAutosendPayload(
  data: Record<string, string>,
): AutosendNotificationPayload | null {
  const type = data.type;
  const sendId = data.sendId?.trim();
  if (!sendId) {
    return null;
  }
  if (type !== 'autosend_review' && type !== 'autosend_sent') {
    return null;
  }
  const shareUrl = data.shareUrl?.trim();
  if (shareUrl) {
    return { type, sendId, shareUrl };
  }
  return { type, sendId };
}

async function persistFcmToken(uid: string, token: string): Promise<void> {
  await firestore()
    .collection('users')
    .doc(uid)
    .set({ fcmTokens: firestore.FieldValue.arrayUnion(token) }, { merge: true });
}

export async function registerFcmToken(uid: string): Promise<void> {
  if (!uid || env.useMockAuth || !isFirebaseConfigured()) {
    return;
  }

  try {
    await messaging().requestPermission();
  } catch {
    // iOS dialog dismissed; Android is a no-op. Token write can still succeed.
  }

  const token = await messaging().getToken();
  if (!token) {
    return;
  }
  await persistFcmToken(uid, token);
}

export function subscribeFcmTokenRefresh(uid: string): () => void {
  if (!uid || env.useMockAuth) {
    return () => undefined;
  }
  return messaging().onTokenRefresh((token) => {
    if (!token) {
      return;
    }
    void persistFcmToken(uid, token).catch(() => undefined);
  });
}

let consumedInitialNotification = false;

export function subscribeAutosendNotificationOpens(
  onOpen: (payload: AutosendNotificationPayload) => void,
): () => void {
  if (env.useMockAuth) {
    return () => undefined;
  }

  let active = true;

  const handleMessage = (
    message: FirebaseMessagingTypes.RemoteMessage | null,
  ): void => {
    if (!active || !message) {
      return;
    }
    const payload = parseAutosendPayload(stringData(message.data));
    if (payload) {
      onOpen(payload);
    }
  };

  const unsubscribe = messaging().onNotificationOpenedApp(handleMessage);

  void messaging()
    .getInitialNotification()
    .then((message) => {
      if (!active || consumedInitialNotification) {
        return;
      }
      consumedInitialNotification = true;
      handleMessage(message);
    })
    .catch(() => undefined);

  return () => {
    active = false;
    unsubscribe();
  };
}

/** Headless handler so Android can receive notification+data while backgrounded. */
export function registerFcmBackgroundHandler(): void {
  if (env.useMockAuth) {
    return;
  }
  messaging().setBackgroundMessageHandler(async () => {
    // OS displays the notification; tap is handled in subscribeAutosendNotificationOpens.
  });
}
