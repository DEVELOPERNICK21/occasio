import { useCallback, useEffect, useRef, useState } from 'react';
import {
  clearCreationDraft,
  readCreationDraft,
  writeCreationDraft,
} from '../data/createDraftStorage';
import {
  defaultTemplateIdForType,
  occasionFromTemplateType,
  occasionToTemplateType,
} from '../domain/audienceOccasion';
import { canPreviewDraft } from '../domain/creationRules';
import type { Audience, Occasion } from '../domain/templateSchema';
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

  const setAudience = useCallback((audience: Audience) => {
    setDraft((d) => ({ ...d, audience }));
  }, []);

  const setOccasion = useCallback((occasion: Occasion) => {
    setDraft((d) => ({
      ...d,
      occasion,
      templateType: occasionToTemplateType(occasion),
    }));
  }, []);

  const setTemplateId = useCallback((templateId: string) => {
    setDraft((d) => ({ ...d, templateId }));
  }, []);

  const setPhotoUris = useCallback((photoUris: string[]) => {
    setDraft((d) => ({ ...d, photoUris }));
  }, []);

  const setRecipientName = useCallback((recipientName: string) => {
    setDraft((d) => ({ ...d, recipientName }));
  }, []);

  const setFromName = useCallback((fromName: string) => {
    setDraft((d) => ({ ...d, fromName }));
  }, []);

  const setMessage = useCallback((message: string) => {
    setDraft((d) => ({ ...d, message }));
  }, []);

  const setExperienceMode = useCallback(
    (experienceMode: CreationDraft['experienceMode']) => {
      setDraft((d) => ({ ...d, experienceMode }));
    },
    [],
  );

  const reset = useCallback(() => {
    setDraft(EMPTY_CREATION_DRAFT);
    void clearCreationDraft();
  }, []);

  const startWish = useCallback(
    (partial: Partial<Pick<CreationDraft, 'templateType' | 'recipientName'>>) => {
      const templateType = partial.templateType ?? 'birthday';
      setDraft({
        ...EMPTY_CREATION_DRAFT,
        templateType,
        templateId: defaultTemplateIdForType(templateType),
        occasion: occasionFromTemplateType(templateType),
        recipientName: partial.recipientName ?? '',
      });
    },
    [],
  );

  /** Frictionless path — occasion and frame preselected, photo is the first ask. */
  const startQuickCreate = useCallback((recipientName = '') => {
    setDraft({
      ...EMPTY_CREATION_DRAFT,
      templateId: 'B10',
      occasion: 'birthday',
      templateType: 'birthday',
      recipientName,
    });
  }, []);

  const startFromAudience = useCallback((audience: Audience) => {
    setDraft({
      ...EMPTY_CREATION_DRAFT,
      audience,
    });
  }, []);

  const canPreview = canPreviewDraft(draft);

  return {
    draft,
    setTemplate,
    setAudience,
    setOccasion,
    setTemplateId,
    setPhotoUris,
    setRecipientName,
    setFromName,
    setMessage,
    setExperienceMode,
    reset,
    startWish,
    startQuickCreate,
    startFromAudience,
    canPreview,
  };
}
