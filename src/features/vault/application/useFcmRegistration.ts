import { useEffect, useRef } from 'react';
import { PermissionsAndroid, Platform, Share } from 'react-native';
import type { NavigationContainerRef } from '@react-navigation/native';
import { useAuth } from '../../auth/application/useAuth';
import type { RootStackParamList } from '../../../shared/navigation/types';
import {
  registerFcmToken,
  subscribeAutosendNotificationOpens,
  subscribeFcmTokenRefresh,
  type AutosendNotificationPayload,
} from '../data/fcmRepository';

export type { AutosendNotificationPayload };

const sharedSendIds = new Set<string>();

async function requestAndroidNotifications(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }
  const apiLevel = typeof Platform.Version === 'number' ? Platform.Version : 0;
  if (apiLevel < 33) {
    return;
  }
  try {
    await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
  } catch {
    // Prompt unavailable; token registration can still proceed.
  }
}

function shareSentLink(sendId: string, shareUrl: string): void {
  if (sharedSendIds.has(sendId)) {
    return;
  }
  sharedSendIds.add(sendId);
  void Share.share({ message: shareUrl, url: shareUrl }).catch(() => {
    sharedSendIds.delete(sendId);
  });
}

export function openAutosendNotification(
  navigation: NavigationContainerRef<RootStackParamList>,
  payload: AutosendNotificationPayload,
): boolean {
  if (!navigation.isReady()) {
    return false;
  }

  navigation.navigate('MainTabs', {
    screen: 'VaultTab',
    params: {
      screen: 'ScheduledSendReview',
      params: { sendId: payload.sendId },
    },
  });

  if (payload.type === 'autosend_sent' && payload.shareUrl) {
    shareSentLink(payload.sendId, payload.shareUrl);
  }

  return true;
}

export function useFcmRegistration(
  onNotificationOpen: (payload: AutosendNotificationPayload) => void,
): void {
  const { user, isSignedIn } = useAuth();
  const uid = user?.uid ?? null;
  const onOpenRef = useRef(onNotificationOpen);
  onOpenRef.current = onNotificationOpen;

  useEffect(() => {
    if (!isSignedIn || !uid) {
      return;
    }

    let cancelled = false;
    let unsubToken: (() => void) | undefined;
    let unsubOpen: (() => void) | undefined;

    void (async () => {
      await requestAndroidNotifications();
      if (cancelled) {
        return;
      }
      try {
        await registerFcmToken(uid);
      } catch {
        if (__DEV__) {
          console.warn('[Occasio] FCM token registration failed');
        }
      }
      if (cancelled) {
        return;
      }
      unsubToken = subscribeFcmTokenRefresh(uid);
      unsubOpen = subscribeAutosendNotificationOpens((payload) => {
        onOpenRef.current(payload);
      });
    })();

    return () => {
      cancelled = true;
      unsubToken?.();
      unsubOpen?.();
    };
  }, [isSignedIn, uid]);
}
