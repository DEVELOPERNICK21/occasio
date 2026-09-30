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

/** A half-typed passcode would silently be dropped, so it blocks sharing. */
export function canGenerateShareLink(draft: CreationDraft): boolean {
  const passcodeOk = draft.passcode === '' || isValidPasscode(draft.passcode);
  return canPreviewDraft(draft) && passcodeOk;
}
