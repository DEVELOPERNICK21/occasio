import { useCallback, useState } from 'react';
import { env } from '../../../shared/config/env';
import { createShareLink } from '../data/creationRepository';
import { resolveCreationMedia } from '../data/photoRefs';
import { CreationApiError } from '../data/types';
import { shouldShowPaywall } from '../domain/quota';
import { canGenerateShareLink } from '../domain/creationRules';
import type { CreationDraft } from '../domain/types';
import type { CreateCreationResponse } from '../data/types';

type State = {
  isLoading: boolean;
  error: string | null;
  paywallRequired: boolean;
  result: CreateCreationResponse | null;
};

const initialState: State = {
  isLoading: false,
  error: null,
  paywallRequired: false,
  result: null,
};

type Options = {
  /** Until billing exists, assume free tier + 0 cards this month for guests. */
  cardsCreatedThisMonth?: number;
};

export function useCreateShareLink(options: Options = {}) {
  const { cardsCreatedThisMonth = 0 } = options;
  const [state, setState] = useState<State>(initialState);

  const generate = useCallback(
    async (draft: CreationDraft) => {
      if (!canGenerateShareLink(draft)) {
        setState((s) => ({
          ...s,
          error: 'Add template, photo, and recipient name first.',
        }));
        return null;
      }

      if (
        shouldShowPaywall(cardsCreatedThisMonth, 'free', {
          bypassQuota: env.devRelaxedQuota,
        })
      ) {
        setState((s) => ({ ...s, paywallRequired: true, error: null }));
        return null;
      }

      setState({ isLoading: true, error: null, paywallRequired: false, result: null });

      try {
        const { photoRefs, mediaUrls } = await resolveCreationMedia(draft.photoUris);
        const result = await createShareLink(draft, photoRefs, mediaUrls);
        setState({ isLoading: false, error: null, paywallRequired: false, result });
        return result;
      } catch (e) {
        if (e instanceof CreationApiError && e.code === 'QUOTA_EXCEEDED') {
          setState({
            isLoading: false,
            error: null,
            paywallRequired: true,
            result: null,
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
        });
        return null;
      }
    },
    [cardsCreatedThisMonth],
  );

  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  return { ...state, generate, reset };
}
