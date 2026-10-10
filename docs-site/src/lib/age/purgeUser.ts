import { getAuth } from 'firebase-admin/auth';
import type { Firestore } from 'firebase-admin/firestore';
import { getAdminApp, getAdminFirestore } from '@/lib/firebaseAdmin';

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

/**
 * Erases an account and everything tied to it. Used when a person turns out to
 * be under 13: we must not keep their data. Mirrors `deleteAccountData` in
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

  const creations = new Map<string, FirebaseFirestore.DocumentReference>();
  history.docs.forEach((d) => creations.set(d.id, db.collection('creations').doc(d.id)));
  owned.docs.forEach((d) => creations.set(d.id, d.ref));

  await deleteAll(db, [
    ...relationships.docs.map((d) => d.ref),
    ...sends.docs.map((d) => d.ref),
    ...history.docs.map((d) => d.ref),
    ...creations.values(),
    db.collection('users').doc(uid),
  ]);

  try {
    await getAuth(getAdminApp()).deleteUser(uid);
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code !== 'auth/user-not-found') throw error;
  }
}
