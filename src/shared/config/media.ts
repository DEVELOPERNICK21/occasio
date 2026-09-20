/** Max photos when media is embedded in Firestore (Spark, pre-Blaze). */
export const MAX_PHOTOS_BASE64 = 5;

/** Max photos when using Firebase Storage (Blaze). */
export const MAX_PHOTOS_STORAGE = 5;

/**
 * Per-photo data URL budget — keeps up to 5 photos under Firestore’s ~1 MB doc cap
 * (5 × 160 KB ≈ 800 KB, leaving room for message + metadata).
 */
export const MAX_BASE64_DATA_URL_CHARS = 160_000;

/** Per-photo cap when uploading to Firebase Storage. */
export const MAX_STORAGE_PHOTO_BYTES = 5 * 1024 * 1024;

/** Card hero crop — matches recipient web split layout (5:4). */
export const CARD_PHOTO_CROP_WIDTH = 1200;
export const CARD_PHOTO_CROP_HEIGHT = 960;
