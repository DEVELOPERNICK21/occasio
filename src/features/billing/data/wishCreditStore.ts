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

/**
 * Free cards the server has counted for this account (users/{uid}.freeCardsUsed).
 * This is the number the server enforces, so the paywall follows it instead of
 * counting local History rows, which can lag or fail to sync.
 */
export async function readFreeCardsUsed(userId: string): Promise<number> {
  const snap = await firestore().collection('users').doc(userId).get();
  const value = snap.data()?.freeCardsUsed;
  return typeof value === 'number' && value > 0 ? value : 0;
}
