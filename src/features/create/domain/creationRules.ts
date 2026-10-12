import type { CreationDraft } from './types';

export const MAX_REASONS = 5;
export const REASON_MAX_CHARS = 90;
const PASSCODE_PATTERN = /^\d{4}$/;

export function isValidPasscode(code: string): boolean {
  return PASSCODE_PATTERN.test(code);
}

/** Trimmed, non-empty reasons only, capped to what the server accepts. */
export function cleanReasons(reasons: readonly string[]): string[] {
  return reasons
    .map((r) => r.trim().slice(0, REASON_MAX_CHARS))
    .filter(Boolean)
    .slice(0, MAX_REASONS);
}

export function canPreviewDraft(draft: CreationDraft): boolean {
  return (
    draft.templateId !== null &&
    draft.photoUris.length >= 1 &&
    draft.recipientName.trim().length > 0
  );
}

/** How many more photos a frame needs than the card has. 0 when it is full. */
export function framePhotosShort(photoCount: number, photoSlots: number | null): number {
  if (photoSlots === null) {
    return 0;
  }
  return Math.max(0, photoSlots - photoCount);
}

export function framePhotosMessage(photosShort: number, photoSlots: number): string {
  const word = photoSlots === 1 ? 'photo' : 'photos';
  const more = photosShort === 1 ? '1 more photo' : `${photosShort} more photos`;
  return `This frame uses ${photoSlots} ${word}. Add ${more} or pick another frame.`;
}

/**
 * A half-typed passcode would silently be dropped, so it blocks sharing. So does
 * a frame with empty slots: the card would show gaps the sender never saw.
 */
export function canGenerateShareLink(
  draft: CreationDraft,
  photoSlots: number | null = null,
): boolean {
  const passcodeOk = draft.passcode === '' || isValidPasscode(draft.passcode);
  return (
    canPreviewDraft(draft) &&
    passcodeOk &&
    framePhotosShort(draft.photoUris.length, photoSlots) === 0
  );
}
