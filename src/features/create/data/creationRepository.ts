import auth from '@react-native-firebase/auth';
import { env, getApiBaseUrl } from '../../../shared/config/env';
import { httpClient } from '../../../shared/api/httpClient';
import { HttpError } from '../../../shared/api/errors';
import { computeShareLinkExpiresAt } from '../domain/shareLink';
import { isSparkBackend } from './backendMode';
import {
  createShareLinkSpark,
  fetchOwnedCreationSpark,
  updateShareLinkSpark,
} from './sparkCreationRepository';
import type { CreationDraft } from '../domain/types';
import type {
  CreateCreationResponse,
  OwnedCreationResponse,
} from './types';
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
    expiresAt: computeShareLinkExpiresAt(createdAt, 'free', true, {
      devShortTtl: env.devRelaxedQuota,
    }).toISOString(),
    watermarked: true,
  };
}

function mockOwnedCreation(draft: CreationDraft, creationId: string): OwnedCreationResponse {
  const slug =
    draft.editingShareSlug ??
    `demo-${slugify(draft.recipientName) || 'card'}`;
  const shareUrl =
    draft.editingShareUrl ?? `${env.shareBaseUrl}/c/${slug}`;
  return {
    creationId,
    shareSlug: slug,
    shareUrl,
    expiresAt:
      draft.editingExpiresAt ??
      computeShareLinkExpiresAt(new Date(), 'free', true, {
        devShortTtl: env.devRelaxedQuota,
      }).toISOString(),
    watermarked: true,
    templateType: draft.templateType ?? 'birthday',
    templateId: draft.templateId,
    recipientName: draft.recipientName,
    fromName: draft.fromName,
    message: draft.message,
    photoRefs: draft.photoUris.map((_, i) => `inline:${i}`),
    mediaUrls: draft.photoUris,
    experienceMode: draft.experienceMode,
    balloonLine: draft.balloonLine.trim() || null,
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

async function requireAuthToken(): Promise<string> {
  const token = await auth().currentUser?.getIdToken();
  if (!token) {
    throw new CreationApiError(
      'UNAUTHORIZED',
      'Sign in to edit this card.',
    );
  }
  return token;
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

  if (isSparkBackend()) {
    return createShareLinkSpark(draft, photoRefs, mediaUrls);
  }

  try {
    return await httpClient.post<CreateCreationResponse>(
      getApiBaseUrl(),
      '/v1/creations',
      {
        templateType: draft.templateType,
        templateId: draft.templateId,
        recipientName: draft.recipientName.trim(),
        fromName: draft.fromName.trim(),
        message: draft.message.trim(),
        photoRefs,
      },
    );
  } catch (error) {
    throw toCreationError(error);
  }
}

/** Load an owned creation so History → Edit can hydrate the draft. */
export async function fetchOwnedCreation(
  creationId: string,
): Promise<OwnedCreationResponse> {
  if (env.useMockApi) {
    await delay(200);
    return mockOwnedCreation(EMPTY_EDIT_DRAFT, creationId);
  }

  if (isSparkBackend()) {
    const token = await requireAuthToken();
    return fetchOwnedCreationSpark(creationId, token);
  }

  try {
    const token = await requireAuthToken();
    return await httpClient.get<OwnedCreationResponse>(
      getApiBaseUrl(),
      `/v1/creations/${encodeURIComponent(creationId)}`,
      { Authorization: `Bearer ${token}` },
    );
  } catch (error) {
    throw toCreationError(error);
  }
}

/** Update in place — same shareSlug / shareUrl. No quota. */
export async function updateShareLink(
  creationId: string,
  draft: CreationDraft,
  photoRefs: string[],
  mediaUrls: string[] = [],
): Promise<CreateCreationResponse> {
  if (!draft.templateType) {
    throw new CreationApiError('VALIDATION_ERROR', 'Template is required');
  }

  if (env.useMockApi) {
    await delay(400);
    return {
      creationId,
      shareSlug: draft.editingShareSlug ?? `demo-edit-${Date.now().toString(36)}`,
      shareUrl:
        draft.editingShareUrl ??
        `${env.shareBaseUrl}/c/${draft.editingShareSlug ?? 'demo'}`,
      expiresAt:
        draft.editingExpiresAt ??
        computeShareLinkExpiresAt(new Date(), 'free', true, {
          devShortTtl: env.devRelaxedQuota,
        }).toISOString(),
      watermarked: true,
    };
  }

  if (isSparkBackend()) {
    const token = await requireAuthToken();
    return updateShareLinkSpark(
      creationId,
      draft,
      photoRefs,
      mediaUrls,
      token,
    );
  }

  try {
    const token = await requireAuthToken();
    return await httpClient.patch<CreateCreationResponse>(
      getApiBaseUrl(),
      `/v1/creations/${encodeURIComponent(creationId)}`,
      {
        templateType: draft.templateType,
        templateId: draft.templateId,
        recipientName: draft.recipientName.trim(),
        fromName: draft.fromName.trim(),
        message: draft.message.trim(),
        photoRefs,
        mediaUrls,
      },
      { Authorization: `Bearer ${token}` },
    );
  } catch (error) {
    throw toCreationError(error);
  }
}

const EMPTY_EDIT_DRAFT: CreationDraft = {
  templateType: 'birthday',
  templateId: 'B10',
  audience: null,
  occasion: 'birthday',
  photoUris: [],
  recipientName: 'Friend',
  fromName: '',
  message: '',
  experienceMode: null,
  balloonLine: '',
  editingCreationId: null,
  editingShareSlug: null,
  editingShareUrl: null,
  editingExpiresAt: null,
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
