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

/** GET /api/v1/creations/:id — owned card for edit. */
export type OwnedCreationResponse = CreateCreationResponse & {
  templateType: string;
  templateId: string | null;
  recipientName: string;
  fromName: string;
  message: string;
  photoRefs: string[];
  mediaUrls: string[];
  experienceMode: 'story' | 'classic' | null;
  balloonLine: string | null;
};

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'QUOTA_EXCEEDED'
  | 'UPLOAD_MISSING'
  | 'UNAUTHORIZED'
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
