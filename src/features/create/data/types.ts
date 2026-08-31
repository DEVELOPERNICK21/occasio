import type { TemplateType } from '../domain/types';

export type PresignUploadResponse = {
  uploadUrl: string;
  photoRef: string;
  expiresIn: number;
};

export type CreateCreationRequest = {
  templateType: TemplateType;
  recipientName: string;
  message: string;
  photoRefs: string[];
  guestSessionId?: string;
};

export type CreateCreationResponse = {
  creationId: string;
  shareSlug: string;
  shareUrl: string;
  expiresAt: string;
  watermarked: boolean;
};

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'QUOTA_EXCEEDED'
  | 'UPLOAD_MISSING'
  | 'INTERNAL';

export class CreationApiError extends Error {
  constructor(
    public readonly code: ApiErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'CreationApiError';
  }
}
