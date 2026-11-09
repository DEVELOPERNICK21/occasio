import firestore from '@react-native-firebase/firestore';
import type { AllowanceCounters } from '../domain/wishBalance';

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

function count(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}

/**
 * Every counter the server keeps for this account's allowance, read together: the free card, the spent
 * single wishes and the times of the Pro cards. The server writes them; the app only shows them.
 */
export async function readAllowanceCounters(userId: string): Promise<AllowanceCounters> {
  const data = (await firestore().collection('users').doc(userId).get()).data();
  const times: unknown = data?.proCardTimes;
  return {
    freeCardsUsed: count(data?.freeCardsUsed),
    wishCreditsUsed: count(data?.wishCreditsUsed),
    proCardTimes: Array.isArray(times)
      ? times.filter((t): t is number => typeof t === 'number' && Number.isFinite(t))
      : [],
  };
}
