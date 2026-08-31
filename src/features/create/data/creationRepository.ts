import { env, getApiBaseUrl } from '../../../shared/config/env';
import { httpClient } from '../../../shared/api/httpClient';
import { HttpError } from '../../../shared/api/errors';
import { computeShareLinkExpiresAt } from '../domain/shareLink';
import { useSparkBackend } from './backendMode';
import { createShareLinkSpark } from './sparkCreationRepository';
import type { CreationDraft } from '../domain/types';
import type { CreateCreationResponse } from './types';
import { CreationApiError } from './types';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function mockCreation(draft: CreationDraft): CreateCreationResponse {
  const slug = `demo-${slugify(draft.recipientName) || 'card'}-${Date.now().toString(36)}`;
  const createdAt = new Date();
  return {
    creationId: `c_mock_${Date.now()}`,
    shareSlug: slug,
    shareUrl: `${env.shareBaseUrl}/c/${slug}`,
    expiresAt: computeShareLinkExpiresAt(createdAt, 'free', true).toISOString(),
    watermarked: true,
  };
}

function toCreationError(error: unknown): CreationApiError {
  if (error instanceof HttpError) {
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

export async function createShareLink(
  draft: CreationDraft,
  photoRefs: string[],
  mediaUrls: string[] = [],
): Promise<CreateCreationResponse> {
  if (!draft.templateType) {
    throw new CreationApiError('VALIDATION_ERROR', 'Template is required');
  }

  if (env.useMockApi) {
    await delay(400);
    return mockCreation(draft);
  }

  if (useSparkBackend()) {
    return createShareLinkSpark(draft, photoRefs, mediaUrls);
  }

  try {
    return await httpClient.post<CreateCreationResponse>(
      getApiBaseUrl(),
      '/v1/creations',
      {
        templateType: draft.templateType,
        recipientName: draft.recipientName.trim(),
        message: draft.message.trim(),
        photoRefs,
      },
    );
  } catch (error) {
    throw toCreationError(error);
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
