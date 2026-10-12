/**
 * What the account purge needs from a Storage bucket. A small interface so the
 * logic can be tested without Firebase.
 */
export type BucketLike = {
  exists(): Promise<[boolean]>;
  deleteFiles(options: { prefix: string; force: boolean }): Promise<unknown>;
  file(path: string): { delete(options: { ignoreNotFound: boolean }): Promise<unknown> };
};

/**
 * Deletes the user's uploaded photos. Everything they upload lives under
 * `uploads/<uid>/`, and photos from before that change are found through the
 * cards that name them.
 *
 * A project without Firebase Storage (the free Spark plan keeps photos inside
 * Firestore instead) has no bucket, so there is nothing to delete and the purge
 * carries on. Any other Storage failure still throws, so the account is never
 * erased while photos could remain.
 */
export async function deleteUserPhotos(
  bucket: BucketLike,
  uid: string,
  legacyPaths: string[],
): Promise<void> {
  const [bucketExists] = await bucket.exists();
  if (!bucketExists) return;

  await bucket.deleteFiles({ prefix: `uploads/${uid}/`, force: true });
  await Promise.all(
    legacyPaths.map((path) => bucket.file(path).delete({ ignoreNotFound: true })),
  );
}
