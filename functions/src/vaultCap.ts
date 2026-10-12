import { syncUserBilling } from './billing';

/** People a plan can keep in the Vault. Same numbers as the app (`tierLimits.ts`). */
export function personCapForTier(tier: unknown): number {
  switch (tier) {
    case 'personal':
      return 5;
    case 'family':
      return 15;
    default:
      return 1;
  }
}

/** The plan RevenueCat reports right now, or null when it cannot be asked. */
export type LiveTierCheck = (
  db: FirebaseFirestore.Firestore,
  uid: string,
) => Promise<string | null>;

export const liveTier: LiveTierCheck = async (db, uid) => {
  try {
    return (await syncUserBilling(db, uid)).tier;
  } catch (error) {
    console.error('VAULT_CAP_TIER_CHECK_FAILED', {
      uid,
      error: error instanceof Error ? error.message : 'unknown',
    });
    return null;
  }
};

/**
 * The app already stops a person adding more people than their plan allows, but
 * Firestore rules cannot count documents, so a modified app could keep adding.
 * Run after a person is created: if the user now holds more than their plan
 * allows, the newest extras are removed.
 *
 * The stored plan can lag a fresh purchase, so before removing anything the
 * plan is read from RevenueCat. If that cannot be done nothing is removed — a
 * paying user's data is never deleted on a guess.
 *
 * Returns how many people were removed.
 */
export async function enforceVaultCap(
  db: FirebaseFirestore.Firestore,
  uid: string,
  checkLiveTier: LiveTierCheck = liveTier,
): Promise<number> {
  if (!uid) return 0;

  const owned = await db.collection('relationships').where('userId', '==', uid).get();
  const userDoc = await db.collection('users').doc(uid).get();
  let cap = personCapForTier(userDoc.data()?.subscriptionTier);
  if (owned.size <= cap) return 0;

  const live = await checkLiveTier(db, uid);
  if (live === null) return 0;
  cap = personCapForTier(live);
  if (owned.size <= cap) return 0;

  const oldestFirst = [...owned.docs].sort(
    (a, b) => a.createTime.toMillis() - b.createTime.toMillis(),
  );
  const extras = oldestFirst.slice(cap);
  await Promise.all(extras.map((doc) => doc.ref.delete()));
  console.warn('VAULT_CAP_ENFORCED', { uid, removed: extras.length, cap });
  return extras.length;
}
