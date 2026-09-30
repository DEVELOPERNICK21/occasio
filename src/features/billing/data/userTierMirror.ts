import auth from '@react-native-firebase/auth';
import { httpClient } from '../../../shared/api/httpClient';
import { getApiBaseUrl } from '../../../shared/config/env';

/**
 * Ask the server to re-read this user's RevenueCat state and write the tier
 * to users/{uid}. Firestore rules block client writes to that field, so the
 * server is the only writer and the auto-send cron can trust it.
 */
export async function syncSubscriptionTier(userId: string): Promise<void> {
  const current = auth().currentUser;
  if (!userId || !current || current.uid !== userId) {
    return;
  }
  const token = await current.getIdToken();
  await httpClient.post(getApiBaseUrl(), '/v1/billing/sync', undefined, {
    Authorization: `Bearer ${token}`,
  });
}
