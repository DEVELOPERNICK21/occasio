import { useCallback, useEffect, useRef, useState } from 'react';
import {
  clearCreationDraft,
  readCreationDraft,
  writeCreationDraft,
} from '../data/createDraftStorage';
import { fetchOwnedCreation } from '../data/creationRepository';
import { CreationApiError } from '../data/types';
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

const TEMPLATE_TYPES = new Set<TemplateType>([
  'birthday',
  'anniversary',
  'sorry',
  'proposal',
  'mothers_day',
  'fathers_day',
  'thank_you',
  'congratulations',
  'just_because',
]);

function parseTemplateType(value: string): TemplateType | null {
  return TEMPLATE_TYPES.has(value as TemplateType)
    ? (value as TemplateType)
    : null;
}

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

  const setBalloonLine = useCallback((balloonLine: string) => {
    setDraft((d) => ({ ...d, balloonLine }));
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

  /** Drop edit markers after a successful PATCH so the next create is fresh. */
  const clearEditing = useCallback(() => {
    setDraft((d) => ({
      ...d,
      editingCreationId: null,
      editingShareSlug: null,
      editingShareUrl: null,
      editingExpiresAt: null,
    }));
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

  /**
   * History → Edit: hydrate draft from owned creation (same share URL on save).
   */
  const loadForEdit = useCallback(async (creationId: string): Promise<string | null> => {
    try {
      const card = await fetchOwnedCreation(creationId);
      const templateType = parseTemplateType(card.templateType) ?? 'birthday';
      const photoUris =
        card.mediaUrls.length > 0
          ? card.mediaUrls
          : [];

      if (photoUris.length < 1) {
        return 'This card has no photos to edit. Create a new card instead.';
      }

      setDraft({
        ...EMPTY_CREATION_DRAFT,
        templateType,
        templateId: card.templateId ?? defaultTemplateIdForType(templateType),
        occasion: occasionFromTemplateType(templateType),
        photoUris,
        recipientName: card.recipientName,
        fromName: card.fromName ?? '',
        message: card.message ?? '',
        experienceMode: card.experienceMode,
        balloonLine: card.balloonLine ?? '',
        editingCreationId: card.creationId,
        editingShareSlug: card.shareSlug,
        editingShareUrl: card.shareUrl,
        editingExpiresAt: card.expiresAt,
      });
      return null;
    } catch (error) {
      if (error instanceof CreationApiError) {
        return error.message;
      }
      return 'Could not load this card for editing.';
    }
  }, []);

  const canPreview = canPreviewDraft(draft);
  const isEditing = Boolean(draft.editingCreationId);

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
    setBalloonLine,
    setExperienceMode,
    reset,
    clearEditing,
    startWish,
    startQuickCreate,
    startFromAudience,
    loadForEdit,
    canPreview,
    isEditing,
  };
}
