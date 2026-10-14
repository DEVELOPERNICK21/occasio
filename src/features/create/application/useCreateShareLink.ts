import { useCallback, useState } from 'react';
import { env } from '../../../shared/config/env';
import {
  createShareLink,
  updateShareLink,
} from '../data/creationRepository';
import { resolveCreationMedia } from '../data/photoRefs';
import { deleteUploadedPhotos } from '../data/storageService';
import { CreationApiError } from '../data/types';
import { shouldShowPaywall } from '../domain/quota';
import {
  canGenerateShareLink,
  framePhotosMessage,
  framePhotosShort,
} from '../domain/creationRules';
import type { SubscriptionTier } from '../../vault/domain/types';
import type { ExtraWishAccess } from '../../billing/domain/types';
import type { CreationDraft } from '../domain/types';
import type { CreateCreationResponse } from '../data/types';

/** Why the free card is not available: it needs a Google or Apple account, or the address cannot be used. */
export type FreeCardBlock = 'needs_provider' | 'not_allowed';

type State = {
  isLoading: boolean;
  error: string | null;
  paywallRequired: boolean;
  /** Set when the server says the free card needs a Google or Apple account, instead of a payment. */
  freeCardBlocked: FreeCardBlock | null;
  result: CreateCreationResponse | null;
  /** True when the last successful save was a PATCH (same URL). */
  wasUpdated: boolean;
};

const initialState: State = {
  isLoading: false,
  error: null,
  paywallRequired: false,
  freeCardBlocked: null,
  result: null,
  wasUpdated: false,
};

type Options = {
  cardsCreated?: number;
  tier?: SubscriptionTier;
  /**
   * Checked live when the free allowance is used — cached tier can lag a fresh
   * purchase. Only decides whether to show the paywall early; the server checks
   * again and spends the credit itself.
   */
  resolveExtraWish?: () => Promise<ExtraWishAccess>;
  /**
   * Free cards the server has counted, read live. The server enforces this
   * number, so it wins over `cardsCreated` (a local count that can lag).
   * Returns null when it could not be read.
   */
  resolveFreeCardsUsed?: () => Promise<number | null>;
  /** Photo slots of the chosen frame; the card cannot be shared with fewer photos. */
  photoSlots?: number | null;
};

function freeCardBlockFor(error: unknown): FreeCardBlock | null {
  if (!(error instanceof CreationApiError)) return null;
  if (error.code === 'FREE_CARD_NEEDS_PROVIDER') return 'needs_provider';
  if (error.code === 'EMAIL_NOT_ALLOWED') return 'not_allowed';
  return null;
}

export function useCreateShareLink(options: Options = {}) {
  const {
    cardsCreated = 0,
    tier = 'free',
    resolveExtraWish,
    resolveFreeCardsUsed,
    photoSlots = null,
  } = options;
  const [state, setState] = useState<State>(initialState);

  const generate = useCallback(
    async (draft: CreationDraft) => {
      const photosShort = framePhotosShort(draft.photoUris.length, photoSlots);
      if (photosShort > 0 && photoSlots !== null) {
        setState((s) => ({
          ...s,
          error: framePhotosMessage(photosShort, photoSlots),
          wasUpdated: false,
        }));
        return null;
      }
      if (!canGenerateShareLink(draft, photoSlots)) {
        setState((s) => ({
          ...s,
          error: 'Add template, photo, and recipient name first.',
          wasUpdated: false,
        }));
        return null;
      }

      const editingId = draft.editingCreationId?.trim() || null;
      const isEdit = Boolean(editingId);

      let used = cardsCreated;
      if (!isEdit && tier === 'free' && resolveFreeCardsUsed) {
        const live = await resolveFreeCardsUsed();
        if (live !== null) {
          used = live;
        }
      }

      if (
        !isEdit &&
        shouldShowPaywall(used, tier, {
          bypassQuota: env.devRelaxedQuota,
        })
      ) {
        const access = resolveExtraWish ? await resolveExtraWish() : 'none';
        if (access === 'none') {
          setState((s) => ({
            ...s,
            paywallRequired: true,
            error: null,
            wasUpdated: false,
          }));
          return null;
        }
      }

      setState({
        isLoading: true,
        error: null,
        paywallRequired: false,
        freeCardBlocked: null,
        result: null,
        wasUpdated: false,
      });

      let uploadedPaths: string[] = [];
      try {
        const { photoRefs, mediaUrls } = await resolveCreationMedia(
          draft.photoUris,
        );
        uploadedPaths = photoRefs;
        const result = isEdit
          ? await updateShareLink(editingId!, draft, photoRefs, mediaUrls)
          : await createShareLink(draft, photoRefs, mediaUrls);
        setState({
          isLoading: false,
          error: null,
          paywallRequired: false,
          freeCardBlocked: null,
          result,
          wasUpdated: isEdit,
        });
        return result;
      } catch (e) {
        // The card was not saved, so the photos just uploaded belong to nothing.
        await deleteUploadedPhotos(uploadedPaths);
        if (e instanceof CreationApiError && e.code === 'QUOTA_EXCEEDED') {
          setState({
            isLoading: false,
            error: null,
            paywallRequired: true,
            freeCardBlocked: null,
            result: null,
            wasUpdated: false,
          });
          return null;
        }
        // The free card is there for a Google or Apple account. Not a payment.
        const blocked = freeCardBlockFor(e);
        if (blocked) {
          setState({
            isLoading: false,
            error: null,
            paywallRequired: false,
            freeCardBlocked: blocked,
            result: null,
            wasUpdated: false,
          });
          return null;
        }
        const message =
          e instanceof Error ? e.message : 'Could not create share link';
        setState({
          isLoading: false,
          error: message,
          paywallRequired: false,
          freeCardBlocked: null,
          result: null,
          wasUpdated: false,
        });
        return null;
      }
    },
    [cardsCreated, tier, resolveExtraWish, resolveFreeCardsUsed, photoSlots],
  );

  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  return { ...state, generate, reset };
}
