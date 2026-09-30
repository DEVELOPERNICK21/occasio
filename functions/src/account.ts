import type { Request, Response } from 'express';
import * as admin from 'firebase-admin';
import { requireUid } from './authUtil';
import { isStoragePath } from './creations';

const BATCH_SIZE = 400;

async function deleteRefs(
  db: FirebaseFirestore.Firestore,
  refs: FirebaseFirestore.DocumentReference[],
): Promise<void> {
  for (let i = 0; i < refs.length; i += BATCH_SIZE) {
    const batch = db.batch();
    for (const ref of refs.slice(i, i + BATCH_SIZE)) {
      batch.delete(ref);
    }
    await batch.commit();
  }
}

/**
 * Remove everything tied to a user: people in the Vault, scheduled sends,
 * shared cards (so links stop working), uploaded photos, profile, and the
 * sign-in account itself.
 */
export async function deleteAccountData(
  db: FirebaseFirestore.Firestore,
  auth: admin.auth.Auth,
  uid: string,
): Promise<void> {
  const relationships = await db
    .collection('relationships')
    .where('userId', '==', uid)
    .get();
  const sends = await db
    .collection('scheduled_sends')
    .where('userId', '==', uid)
    .get();
  const history = await db
    .collection('user_creations')
    .where('userId', '==', uid)
    .get();
  const owned = await db.collection('creations').where('userId', '==', uid).get();

  const creationRefs = new Map<string, FirebaseFirestore.DocumentReference>();
  for (const doc of history.docs) {
    creationRefs.set(doc.id, db.collection('creations').doc(doc.id));
  }
  for (const doc of owned.docs) {
    creationRefs.set(doc.id, doc.ref);
  }

  const storagePaths: string[] = [];
  for (const ref of creationRefs.values()) {
    const snap = await ref.get();
    const photoRefs = snap.data()?.photoRefs;
    if (Array.isArray(photoRefs)) {
      for (const item of photoRefs) {
        if (typeof item === 'string' && isStoragePath(item)) {
          storagePaths.push(item);
        }
      }
    }
  }
  if (storagePaths.length > 0) {
    try {
      const bucket = admin.storage().bucket();
      await Promise.all(
        storagePaths.map((path) =>
          bucket.file(path).delete({ ignoreNotFound: true }),
        ),
      );
    } catch (error) {
      console.error('account delete: storage cleanup failed', error);
    }
  }

  await deleteRefs(db, [
    ...relationships.docs.map((d) => d.ref),
    ...sends.docs.map((d) => d.ref),
    ...history.docs.map((d) => d.ref),
    ...creationRefs.values(),
    db.collection('users').doc(uid),
  ]);

  await auth.deleteUser(uid);
}

export async function handleDeleteAccount(
  req: Request,
  res: Response,
  db: FirebaseFirestore.Firestore,
  auth: admin.auth.Auth,
): Promise<void> {
  const uid = await requireUid(req, auth);
  if (!uid) {
    res.status(401).json({ code: 'UNAUTHORIZED' });
    return;
  }
  try {
    await deleteAccountData(db, auth, uid);
    res.status(200).json({ ok: true });
  } catch (error) {
    console.error('account delete failed', uid, error);
    res.status(500).json({ code: 'INTERNAL' });
  }
}
