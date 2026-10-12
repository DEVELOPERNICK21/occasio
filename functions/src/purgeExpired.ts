import * as admin from 'firebase-admin';
import { isStoragePath } from './creations';

/**
 * Keeps the privacy-policy promise that expired cards are deleted. A card is
 * removed this long after its link expired.
 */
export const PURGE_GRACE_DAYS = 14;
/** Cards disabled by a takedown are kept this long so a counter-notice can restore them. */
export const TAKEDOWN_RETAIN_DAYS = 90;

const DAY_MS = 86_400_000;
const BATCH = 200;

type CardFacts = { expiresAt: Date | null; takedownAt: Date | null };

/** Pure rule, so it can be tested without a database. */
export function shouldPurge(card: CardFacts, now: Date): boolean {
  if (!card.expiresAt) return false;
  if (card.takedownAt) {
    return now.getTime() - card.takedownAt.getTime() >= TAKEDOWN_RETAIN_DAYS * DAY_MS;
  }
  return now.getTime() - card.expiresAt.getTime() >= PURGE_GRACE_DAYS * DAY_MS;
}

function toDate(value: unknown): Date | null {
  return value && typeof (value as { toDate?: unknown }).toDate === 'function'
    ? (value as { toDate: () => Date }).toDate()
    : null;
}

/** Deletes expired cards (and any photos stored in Storage). Returns how many were removed. */
export async function purgeExpiredCards(
  db: FirebaseFirestore.Firestore,
  now: Date = new Date(),
  limit = 1000,
): Promise<number> {
  const cutoff = admin.firestore.Timestamp.fromMillis(now.getTime() - PURGE_GRACE_DAYS * DAY_MS);
  const snap = await db
    .collection('creations')
    .where('expiresAt', '<', cutoff)
    .limit(limit)
    .get();

  const doomed = snap.docs.filter((doc) =>
    shouldPurge(
      { expiresAt: toDate(doc.get('expiresAt')), takedownAt: toDate(doc.get('takedownAt')) },
      now,
    ),
  );

  const paths = doomed.flatMap((doc) => {
    const refs = doc.get('photoRefs');
    return Array.isArray(refs)
      ? refs.filter((r): r is string => typeof r === 'string' && isStoragePath(r))
      : [];
  });
  if (paths.length > 0) {
    try {
      const bucket = admin.storage().bucket();
      await Promise.all(paths.map((p) => bucket.file(p).delete({ ignoreNotFound: true })));
    } catch (error) {
      console.error('purge: storage cleanup failed', error);
    }
  }

  for (let i = 0; i < doomed.length; i += BATCH) {
    const batch = db.batch();
    doomed.slice(i, i + BATCH).forEach((doc) => {
      batch.delete(doc.ref);
      // The owner's History row shares the card's id; drop it so it doesn't point at nothing.
      batch.delete(db.collection('user_creations').doc(doc.id));
    });
    await batch.commit();
  }
  return doomed.length;
}
