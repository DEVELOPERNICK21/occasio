import { getAuth } from 'firebase-admin/auth';
import type { Firestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { getAdminApp, getAdminFirestore } from '@/lib/firebaseAdmin';
import { storageBucketName } from '@/lib/storagePaths';

const BATCH = 400;

async function deleteAll(
  db: Firestore,
  refs: FirebaseFirestore.DocumentReference[],
): Promise<void> {
  for (let i = 0; i < refs.length; i += BATCH) {
    const batch = db.batch();
    refs.slice(i, i + BATCH).forEach((ref) => batch.delete(ref));
    await batch.commit();
  }
}

/** Storage paths (`uploads/...`) named in a list of Firestore photoRefs fields. */
function storagePathsOf(values: unknown[]): string[] {
  const paths: string[] = [];
  for (const value of values) {
    if (!Array.isArray(value)) continue;
    for (const item of value) {
      if (typeof item === 'string' && item.startsWith('uploads/')) paths.push(item);
    }
  }
  return paths;
}

/**
 * Deletes the user's photos. Everything they upload lives under `uploads/<uid>/`,
 * and photos from before that change are found through the cards that name them.
 * Throws if Storage fails, so the account is not erased while photos remain.
 */
async function deleteUserPhotos(uid: string, legacyPaths: string[]): Promise<void> {
  const bucket = getStorage(getAdminApp()).bucket(storageBucketName());
  await bucket.deleteFiles({ prefix: `uploads/${uid}/`, force: true });
  await Promise.all(
    legacyPaths.map((path) => bucket.file(path).delete({ ignoreNotFound: true })),
  );
}

/**
 * Erases an account and everything tied to it. Used for in-app account deletion
 * and when a person turns out to be under 13. Mirrors `deleteAccountData` in
 * `functions/src/account.ts` (that one is deployed separately).
 */
export async function purgeUser(uid: string): Promise<void> {
  const db = getAdminFirestore();
  const [relationships, sends, history, owned] = await Promise.all([
    db.collection('relationships').where('userId', '==', uid).get(),
    db.collection('scheduled_sends').where('userId', '==', uid).get(),
    db.collection('user_creations').where('userId', '==', uid).get(),
    db.collection('creations').where('userId', '==', uid).get(),
  ]);

  // Only cards this user owns are deleted. A History row is just a pointer, so
  // it can never be used to delete somebody else's card.
  await deleteUserPhotos(
    uid,
    storagePathsOf([
      ...owned.docs.map((d) => d.get('photoRefs')),
      ...relationships.docs.map((d) => d.get('photoRefs')),
    ]),
  );

  await deleteAll(db, [
    ...relationships.docs.map((d) => d.ref),
    ...sends.docs.map((d) => d.ref),
    ...history.docs.map((d) => d.ref),
    ...owned.docs.map((d) => d.ref),
    db.collection('users').doc(uid),
  ]);

  try {
    await getAuth(getAdminApp()).deleteUser(uid);
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code !== 'auth/user-not-found') throw error;
  }
}
