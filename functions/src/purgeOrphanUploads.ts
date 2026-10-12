import * as admin from 'firebase-admin';

/**
 * A photo is only removed once it has been unreferenced for this long, so a
 * card that is still being created (upload done, save not yet) is never touched.
 */
export const ORPHAN_GRACE_MS = 24 * 60 * 60 * 1000;

type StoredFile = {
  name: string;
  metadata: { timeCreated?: string };
  delete: (options?: { ignoreNotFound?: boolean }) => Promise<unknown>;
};

/** Pure rule: old enough to be judged an orphan? */
export function isPastGrace(timeCreated: string | undefined, now: Date): boolean {
  if (!timeCreated) return false;
  const created = Date.parse(timeCreated);
  return Number.isFinite(created) && now.getTime() - created >= ORPHAN_GRACE_MS;
}

async function isReferenced(db: FirebaseFirestore.Firestore, path: string): Promise<boolean> {
  for (const collection of ['creations', 'relationships']) {
    const snap = await db
      .collection(collection)
      .where('photoRefs', 'array-contains', path)
      .limit(1)
      .get();
    if (!snap.empty) return true;
  }
  return false;
}

/**
 * Deletes uploaded photos that no card or Vault person points to — left behind
 * by a failed share, an edit that swapped photos, or a deleted card.
 */
export async function purgeOrphanUploads(
  db: FirebaseFirestore.Firestore,
  now: Date = new Date(),
  limit = 500,
  listFiles: () => Promise<StoredFile[]> = async () => {
    const [files] = await admin
      .storage()
      .bucket()
      .getFiles({ prefix: 'uploads/', maxResults: limit });
    return files as unknown as StoredFile[];
  },
): Promise<number> {
  const files = await listFiles();
  let removed = 0;
  for (const file of files) {
    if (!isPastGrace(file.metadata.timeCreated, now)) continue;
    if (await isReferenced(db, file.name)) continue;
    await file.delete({ ignoreNotFound: true });
    removed += 1;
  }
  return removed;
}
