import { useCallback, useEffect, useRef, useState } from 'react';
import {
  clearCreationDraft,
  readCreationDraft,
  writeCreationDraft,
} from '../data/createDraftStorage';
import { canPreviewDraft } from '../domain/creationRules';
import {
  EMPTY_CREATION_DRAFT,
  type CreationDraft,
  type TemplateType,
} from '../domain/types';

const PERSIST_DEBOUNCE_MS = 300;

export function useCreateDraft() {
  const [draft, setDraft] = useState<CreationDraft>(EMPTY_CREATION_DRAFT);
  const [isHydrated, setIsHydrated] = useState(false);
  const persistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;

    void readCreationDraft().then((stored) => {
      if (cancelled) return;
      if (stored) {
        setDraft(stored);
      }
      setIsHydrated(true);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    if (persistTimerRef.current) {
      clearTimeout(persistTimerRef.current);
    }

    persistTimerRef.current = setTimeout(() => {
      void writeCreationDraft(draft);
    }, PERSIST_DEBOUNCE_MS);

    return () => {
      if (persistTimerRef.current) {
        clearTimeout(persistTimerRef.current);
      }
    };
  }, [draft, isHydrated]);

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
    void clearCreationDraft();
  }, []);

  const startWish = useCallback(
    (partial: Partial<Pick<CreationDraft, 'templateType' | 'recipientName'>>) => {
      setDraft({
        ...EMPTY_CREATION_DRAFT,
        ...partial,
      });
    },
    [],
  );

  const canPreview = canPreviewDraft(draft);

  return {
    draft,
    setTemplate,
    setPhotoUris,
    setRecipientName,
    setMessage,
    reset,
    startWish,
    canPreview,
  };
}
