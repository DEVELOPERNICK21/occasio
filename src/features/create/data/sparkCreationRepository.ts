import { env } from '../../../shared/config/env';
import { httpClient } from '../../../shared/api/httpClient';
import { HttpError } from '../../../shared/api/errors';
import type { CreationDraft } from '../domain/types';
import type { CreateCreationResponse } from './types';
import { CreationApiError } from './types';

function toCreationError(error: unknown): CreationApiError {
  if (error instanceof HttpError) {
    if (error.status === 404) {
      return new CreationApiError(
        'INTERNAL',
        'Share API not found. Deploy docs-site to Vercel with the latest code.',
      );
    }
    if (error.status === 503) {
      return new CreationApiError(
        'INTERNAL',
        'Server not configured. Add FIREBASE_SERVICE_ACCOUNT_JSON on Vercel and redeploy.',
      );
    }
    const code =
      error.code === 'NOT_FOUND' ||
      error.code === 'EXPIRED' ||
      error.code === 'NOT_IMPLEMENTED'
        ? 'INTERNAL'
        : error.code;
    return new CreationApiError(code, error.message);
  }
  if (error instanceof CreationApiError) {
    return error;
  }
  return new CreationApiError('INTERNAL', 'Could not create share link');
}

/** Spark plan: create via Vercel API (Admin SDK server-side — no direct Firestore from app). */
export async function createShareLinkSpark(
  draft: CreationDraft,
  photoRefs: string[],
  mediaUrls: string[] = [],
): Promise<CreateCreationResponse> {
  if (!draft.templateType) {
    throw new CreationApiError('VALIDATION_ERROR', 'Template is required');
  }

  try {
    return await httpClient.post<CreateCreationResponse>(
      env.sparkApiBaseUrl,
      '/api/v1/creations',
      {
        templateType: draft.templateType,
        recipientName: draft.recipientName.trim(),
        message: draft.message.trim(),
        photoRefs,
        mediaUrls,
        ...(env.devRelaxedQuota ? { devMode: true } : {}),
      },
    );
  } catch (error) {
    throw toCreationError(error);
  }
}
