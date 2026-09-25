import { useCallback, useState } from 'react';
import { env } from '../../../shared/config/env';
import {
  createShareLink,
  updateShareLink,
} from '../data/creationRepository';
import { resolveCreationMedia } from '../data/photoRefs';
import { CreationApiError } from '../data/types';
import { shouldShowPaywall } from '../domain/quota';
import { canGenerateShareLink } from '../domain/creationRules';
import type { SubscriptionTier } from '../../vault/domain/types';
import type { CreationDraft } from '../domain/types';
import type { CreateCreationResponse } from '../data/types';

type State = {
  isLoading: boolean;
  error: string | null;
  paywallRequired: boolean;
  result: CreateCreationResponse | null;
  /** True when the last successful save was a PATCH (same URL). */
  wasUpdated: boolean;
};

const initialState: State = {
  isLoading: false,
  error: null,
  paywallRequired: false,
  result: null,
  wasUpdated: false,
};

type Options = {
  cardsCreatedThisMonth?: number;
  tier?: SubscriptionTier;
};

export function useCreateShareLink(options: Options = {}) {
  const { cardsCreatedThisMonth = 0, tier = 'free' } = options;
  const [state, setState] = useState<State>(initialState);

  const generate = useCallback(
    async (draft: CreationDraft) => {
      if (!canGenerateShareLink(draft)) {
        setState((s) => ({
          ...s,
          error: 'Add template, photo, and recipient name first.',
          wasUpdated: false,
        }));
        return null;
      }

      const editingId = draft.editingCreationId?.trim() || null;
      const isEdit = Boolean(editingId);

      if (
        !isEdit &&
        shouldShowPaywall(cardsCreatedThisMonth, tier, {
          bypassQuota: env.devRelaxedQuota,
        })
      ) {
        setState((s) => ({
          ...s,
          paywallRequired: true,
          error: null,
          wasUpdated: false,
        }));
        return null;
      }

      setState({
        isLoading: true,
        error: null,
        paywallRequired: false,
        result: null,
        wasUpdated: false,
      });

      try {
        const { photoRefs, mediaUrls } = await resolveCreationMedia(
          draft.photoUris,
        );
        const result = isEdit
          ? await updateShareLink(editingId!, draft, photoRefs, mediaUrls)
          : await createShareLink(draft, photoRefs, mediaUrls);
        setState({
          isLoading: false,
          error: null,
          paywallRequired: false,
          result,
          wasUpdated: isEdit,
        });
        return result;
      } catch (e) {
        if (e instanceof CreationApiError && e.code === 'QUOTA_EXCEEDED') {
          setState({
            isLoading: false,
            error: null,
            paywallRequired: true,
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
          result: null,
          wasUpdated: false,
        });
        return null;
      }
    },
    [cardsCreatedThisMonth, tier],
  );

  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  return { ...state, generate, reset };
}
