import { env, getApiBaseUrl } from '../../../shared/config/env';
import { httpClient } from '../../../shared/api/httpClient';
import { HttpError } from '../../../shared/api/errors';
import type { PresignUploadResponse } from './types';
import { CreationApiError } from './types';

/** Request presigned upload URL — server assigns photoRef. */
export async function requestPresignedUpload(
  contentType = 'image/jpeg',
): Promise<PresignUploadResponse> {
  if (env.useMockApi) {
    const id = `mock-${Date.now()}`;
    return {
      uploadUrl: `mock://upload/${id}`,
      photoRef: `uploads/tmp/${id}.jpg`,
      expiresIn: 900,
    };
  }

  try {
    return await httpClient.post<PresignUploadResponse>(
      getApiBaseUrl(),
      '/v1/uploads/presign',
      { contentType },
    );
  } catch (error) {
    if (error instanceof HttpError && error.code === 'NOT_IMPLEMENTED') {
      throw new CreationApiError(
        'INTERNAL',
        'Photo upload is not available yet — use mock mode for local dev.',
      );
    }
    throw new CreationApiError('INTERNAL', 'Failed to get upload URL');
  }
}

/**
 * Upload local file URI to presigned URL.
 * Mock mode: returns photoRef without network upload.
 */
export async function uploadPhoto(
  localUri: string,
  presign: PresignUploadResponse,
): Promise<string> {
  if (env.useMockApi || presign.uploadUrl.startsWith('mock://')) {
    return presign.photoRef;
  }

  const blob = await fetch(localUri).then((r) => r.blob());
  const res = await fetch(presign.uploadUrl, {
    method: 'PUT',
    body: blob,
    headers: { 'Content-Type': 'image/jpeg' },
  });

  if (!res.ok) {
    throw new CreationApiError('INTERNAL', 'Photo upload failed');
  }

  return presign.photoRef;
}
