/** Max photos when media is embedded in Firestore (Spark, pre-Blaze). */
export const MAX_PHOTOS_BASE64 = 1;

/** Max photos when using Firebase Storage (Blaze). */
export const MAX_PHOTOS_STORAGE = 3;

/** ~750 KB data URL — leaves room for other Firestore fields under 1 MB doc cap. */
export const MAX_BASE64_DATA_URL_CHARS = 750_000;

/** Per-photo cap when uploading to Firebase Storage. */
export const MAX_STORAGE_PHOTO_BYTES = 5 * 1024 * 1024;

/** Card hero crop — matches recipient web split layout (5:4). */
export const CARD_PHOTO_CROP_WIDTH = 1200;
export const CARD_PHOTO_CROP_HEIGHT = 960;
