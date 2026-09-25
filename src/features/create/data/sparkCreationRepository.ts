import { env } from '../../../shared/config/env';
import { httpClient } from '../../../shared/api/httpClient';
import { HttpError } from '../../../shared/api/errors';
import type { CreationDraft } from '../domain/types';
import type {
  CreateCreationResponse,
  OwnedCreationResponse,
} from './types';
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
    if (error.status === 410) {
      return new CreationApiError(
        'INTERNAL',
        'This link has expired. Create a new card instead.',
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

function authHeaders(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

function creationBody(
  draft: CreationDraft,
  photoRefs: string[],
  mediaUrls: string[],
) {
  return {
    templateType: draft.templateType,
    templateId: draft.templateId,
    recipientName: draft.recipientName.trim(),
    fromName: draft.fromName.trim(),
    message: draft.message.trim(),
    photoRefs,
    mediaUrls,
    ...(draft.balloonLine.trim()
      ? { balloonLine: draft.balloonLine.trim() }
      : {}),
    ...(draft.experienceMode === 'story' || draft.experienceMode === 'classic'
      ? { experienceMode: draft.experienceMode }
      : {}),
    ...(env.devRelaxedQuota ? { devMode: true } : {}),
  };
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
      creationBody(draft, photoRefs, mediaUrls),
    );
  } catch (error) {
    throw toCreationError(error);
  }
}

export async function fetchOwnedCreationSpark(
  creationId: string,
  token: string,
): Promise<OwnedCreationResponse> {
  try {
    return await httpClient.get<OwnedCreationResponse>(
      env.sparkApiBaseUrl,
      `/api/v1/creations/${encodeURIComponent(creationId)}`,
      authHeaders(token),
    );
  } catch (error) {
    throw toCreationError(error);
  }
}

export async function updateShareLinkSpark(
  creationId: string,
  draft: CreationDraft,
  photoRefs: string[],
  mediaUrls: string[],
  token: string,
): Promise<CreateCreationResponse> {
  if (!draft.templateType) {
    throw new CreationApiError('VALIDATION_ERROR', 'Template is required');
  }

  try {
    return await httpClient.patch<CreateCreationResponse>(
      env.sparkApiBaseUrl,
      `/api/v1/creations/${encodeURIComponent(creationId)}`,
      creationBody(draft, photoRefs, mediaUrls),
      authHeaders(token),
    );
  } catch (error) {
    throw toCreationError(error);
  }
}
