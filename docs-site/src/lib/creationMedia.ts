/** Longest message a card can carry. The app's message box uses the same number. */
export const MAX_MESSAGE_CHARS = 280;

export const MAX_PHOTOS = 5;

/** Per inline photo — keep total under Firestore ~1 MB with message + metadata. */
export const MAX_BASE64_DATA_URL_CHARS = 160_000;

const INLINE_REF = /^inline:\d+$/;
const STORAGE_REF = /^uploads\/([A-Za-z0-9_-]{1,128})\/[A-Za-z0-9._-]{1,128}$/;
const DATA_URL = /^data:image\/(jpeg|png|webp|heic);base64,[A-Za-z0-9+/=]+$/;

/**
 * Photo references and display URLs a card is allowed to hold.
 *
 * - photoRefs: `inline:N` or a Storage path inside the caller's own folder
 *   (`uploads/<uid>/...`). A path the card already had stays allowed, so older
 *   cards can still be edited.
 * - mediaUrls: base64 image data URLs, or a link into our own Storage bucket.
 *   Never an arbitrary web address, so a card cannot point recipients at
 *   somebody else's server.
 *
 * Returns a message when something is not allowed, otherwise null.
 */
export function mediaViolation(args: {
  photoRefs: string[];
  mediaUrls: string[];
  uid: string;
  bucket: string;
  existingRefs?: string[];
}): string | null {
  const { photoRefs, mediaUrls, uid, bucket, existingRefs = [] } = args;

  const inline = photoRefs.filter((ref) => INLINE_REF.test(ref)).length;
  if (inline !== 0 && inline !== photoRefs.length) {
    return 'Photos cannot mix inline and stored files';
  }

  for (const ref of photoRefs) {
    if (typeof ref !== 'string') return 'Invalid photo reference';
    if (INLINE_REF.test(ref)) continue;
    const match = STORAGE_REF.exec(ref);
    if (!match) return 'Invalid photo reference';
    if (match[1] !== uid && !existingRefs.includes(ref)) {
      return 'Photo does not belong to your account';
    }
  }

  if (mediaUrls.length > MAX_PHOTOS) return `mediaUrls must contain 1–${MAX_PHOTOS} items`;
  if (inline > 0 && mediaUrls.length > 0 && mediaUrls.length !== photoRefs.length) {
    return 'Inline photos must match photoRefs';
  }

  const bucketPrefix = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/uploads%2F`;
  for (const url of mediaUrls) {
    if (typeof url !== 'string') return 'Invalid image URL';
    if (url.startsWith('data:')) {
      if (!DATA_URL.test(url)) return 'Invalid image data URL';
      if (url.length > MAX_BASE64_DATA_URL_CHARS) return 'Photo is too large';
    } else if (!url.startsWith(bucketPrefix) || url.length > 600) {
      return 'Invalid image URL';
    }
  }
  return null;
}
