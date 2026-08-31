import { useCallback, useState } from 'react';
import { canPreviewDraft } from '../domain/creationRules';
import {
  EMPTY_CREATION_DRAFT,
  type CreationDraft,
  type TemplateType,
} from '../domain/types';

export function useCreateDraft() {
  const [draft, setDraft] = useState<CreationDraft>(EMPTY_CREATION_DRAFT);

  const setTemplate = useCallback((templateType: TemplateType) => {
    setDraft((d) => ({ ...d, templateType }));
  }, []);

  const setPhotoUris = useCallback((photoUris: string[]) => {
    setDraft((d) => ({ ...d, photoUris }));
  }, []);

  const setRecipientName = useCallback((recipientName: string) => {
    setDraft((d) => ({ ...d, recipientName }));
  }, []);

  const setMessage = useCallback((message: string) => {
    setDraft((d) => ({ ...d, message }));
  }, []);

  const reset = useCallback(() => {
    setDraft(EMPTY_CREATION_DRAFT);
  }, []);

  const canPreview = canPreviewDraft(draft);

  return {
    draft,
    setTemplate,
    setPhotoUris,
    setRecipientName,
    setMessage,
    reset,
    canPreview,
  };
}
