import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { httpClient } from '../../../shared/api/httpClient';
import { getApiBaseUrl } from '../../../shared/config/env';

/**
 * Spent single-wish credits live on users/{uid}.wishCreditsUsed; purchases come
 * from RevenueCat, so available = purchased − used. The field is written only
 * by the server (see consumeWishCredit).
 */
export async function readWishCreditsUsed(userId: string): Promise<number> {
  const snap = await firestore().collection('users').doc(userId).get();
  const value = snap.data()?.wishCreditsUsed;
  return typeof value === 'number' && value > 0 ? value : 0;
}

/** Server verifies the purchase with RevenueCat before spending a credit. */
export async function incrementWishCreditsUsed(userId: string): Promise<void> {
  const current = auth().currentUser;
  if (!userId || !current || current.uid !== userId) {
    return;
  }
  const token = await current.getIdToken();
  await httpClient.post(getApiBaseUrl(), '/v1/billing/consume-credit', undefined, {
    Authorization: `Bearer ${token}`,
  });
}
