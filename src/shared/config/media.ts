/** Max photos when media is embedded in Firestore (Spark, pre-Blaze). */
export const MAX_PHOTOS_BASE64 = 1;

/** Max photos when using Firebase Storage (Blaze). */
export const MAX_PHOTOS_STORAGE = 3;

/** ~750 KB data URL — leaves room for other Firestore fields under 1 MB doc cap. */
export const MAX_BASE64_DATA_URL_CHARS = 750_000;
