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
import {
  INVITATION_TEMPLATE,
  emptyInvitation,
  invitationFromStored,
  invitationTitle,
  type InvitationDraft,
  type InvitationOccasion,
} from '../domain/invitation';
import { holidayById, type HolidayId } from '../domain/holidays';
import { parseTemplateType } from '../domain/templates';
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

  const setBalloonLine = useCallback((balloonLine: string) => {
    setDraft((d) => ({ ...d, balloonLine }));
  }, []);

  const setReasons = useCallback((reasons: string[]) => {
    setDraft((d) => ({ ...d, reasons }));
  }, []);

  const setPasscode = useCallback((passcode: string) => {
    setDraft((d) => ({ ...d, passcode: passcode.replace(/\D/g, '').slice(0, 4) }));
  }, []);

  const setPasscodeHint = useCallback((passcodeHint: string) => {
    setDraft((d) => ({ ...d, passcodeHint: passcodeHint.slice(0, 60) }));
  }, []);

  const setExperienceMode = useCallback(
    (experienceMode: CreationDraft['experienceMode']) => {
      setDraft((d) => ({ ...d, experienceMode }));
    },
    [],
  );

  /** A new invitation for this occasion. It replaces whatever card was being made: there is one draft. */
  const startInvitation = useCallback((occasion: InvitationOccasion) => {
    setDraft({
      ...EMPTY_CREATION_DRAFT,
      templateType: INVITATION_TEMPLATE,
      templateId: defaultTemplateIdForType(INVITATION_TEMPLATE),
      invitation: emptyInvitation(occasion),
    });
  }, []);

  /**
   * Changes some of the invitation's fields. The name the card is addressed to follows the names, so
   * a link, a History row and a guest's preview always say who it is for.
   */
  const updateInvitation = useCallback((patch: Partial<InvitationDraft>) => {
    setDraft((d) => {
      if (!d.invitation) return d;
      const invitation = { ...d.invitation, ...patch };
      return { ...d, invitation, recipientName: invitationTitle(invitation) };
    });
  }, []);

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

  /**
   * A festival or holiday card: its type and stand-in occasion are set, the photo is the first ask.
   * `keepAudience` carries over who it is for when they already said (from the "What's the moment?"
   * step); otherwise the festival's usual audience, or a neutral one so the frames can be listed.
   */
  const startFromHoliday = useCallback((id: HolidayId, keepAudience = false) => {
    const holiday = holidayById(id);
    if (!holiday) return;
    setDraft((d) => ({
      ...EMPTY_CREATION_DRAFT,
      audience: keepAudience && d.audience ? d.audience : (holiday.audience ?? 'someone_special'),
      occasion: holiday.frame,
      templateType: holiday.id,
    }));
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

      if (templateType === INVITATION_TEMPLATE) {
        const invitation = invitationFromStored(card.invitation);
        if (!invitation) return 'This invitation could not be opened for editing.';
        setDraft({
          ...EMPTY_CREATION_DRAFT,
          templateType,
          templateId: defaultTemplateIdForType(templateType),
          photoUris,
          recipientName: card.recipientName,
          message: card.message ?? '',
          invitation,
          editingCreationId: card.creationId,
          editingShareSlug: card.shareSlug,
          editingShareUrl: card.shareUrl,
          editingExpiresAt: card.expiresAt,
        });
        return null;
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
        reasons: card.reasons ?? [],
        passcodeHint: card.passcodeHint ?? '',
        hasPasscode: card.hasPasscode === true,
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
    setReasons,
    setPasscode,
    setPasscodeHint,
    setExperienceMode,
    reset,
    clearEditing,
    startWish,
    startQuickCreate,
    startFromAudience,
    startFromHoliday,
    startInvitation,
    updateInvitation,
    loadForEdit,
    canPreview,
    isEditing,
    isHydrated,
  };
}
