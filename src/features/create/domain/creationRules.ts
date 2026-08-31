import type { CreationDraft } from './types';

export function canPreviewDraft(draft: CreationDraft): boolean {
  return (
    draft.templateType !== null &&
    draft.photoUris.length >= 1 &&
    draft.recipientName.trim().length > 0
  );
}

export function canGenerateShareLink(draft: CreationDraft): boolean {
  return canPreviewDraft(draft);
}
