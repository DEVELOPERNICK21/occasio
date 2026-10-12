const DEFAULT_PROJECT_ID = 'occasio-app-dev';

/** Bucket the app uploads photos to. Override with FIREBASE_STORAGE_BUCKET. */
export function storageBucketName(): string {
  return (
    process.env.FIREBASE_STORAGE_BUCKET?.trim() ||
    `${DEFAULT_PROJECT_ID}.firebasestorage.app`
  );
}
