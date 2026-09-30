import firestore from '@react-native-firebase/firestore';

/**
 * Spent single-wish credits live on users/{uid}.wishCreditsUsed; purchases come
 * from RevenueCat, so available = purchased − used.
 */
export async function readWishCreditsUsed(userId: string): Promise<number> {
  const snap = await firestore().collection('users').doc(userId).get();
  const value = snap.data()?.wishCreditsUsed;
  return typeof value === 'number' && value > 0 ? value : 0;
}

export async function incrementWishCreditsUsed(userId: string): Promise<void> {
  await firestore()
    .collection('users')
    .doc(userId)
    .set({ wishCreditsUsed: firestore.FieldValue.increment(1) }, { merge: true });
}
