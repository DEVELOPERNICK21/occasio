import firestore from '@react-native-firebase/firestore';

/**
 * Spent single-wish credits live on users/{uid}.wishCreditsUsed; purchases come
 * from RevenueCat, so available = purchased − used. The server spends a credit
 * in the same transaction that creates the card, so the app only reads it.
 */
export async function readWishCreditsUsed(userId: string): Promise<number> {
  const snap = await firestore().collection('users').doc(userId).get();
  const value = snap.data()?.wishCreditsUsed;
  return typeof value === 'number' && value > 0 ? value : 0;
}
