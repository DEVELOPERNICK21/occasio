import { env } from '../../../shared/config/env';
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
  return {
    creationId: `c_mock_${Date.now()}`,
    shareSlug: slug,
    shareUrl: `${env.shareBaseUrl}/c/${slug}`,
    expiresAt: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(),
    watermarked: true,
  };
}

export async function createShareLink(
  draft: CreationDraft,
  photoRefs: string[],
): Promise<CreateCreationResponse> {
  if (!draft.templateType) {
    throw new CreationApiError('VALIDATION_ERROR', 'Template is required');
  }

  if (env.useMockApi) {
    await delay(400);
    return mockCreation(draft);
  }

  const res = await fetch(`${env.apiBaseUrl}/v1/creations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      templateType: draft.templateType,
      recipientName: draft.recipientName.trim(),
      message: draft.message.trim(),
      photoRefs,
    }),
  });

  if (res.status === 402) {
    throw new CreationApiError('QUOTA_EXCEEDED', 'Free monthly limit reached');
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { code?: string };
    const code = (body.code as CreationApiError['code']) ?? 'INTERNAL';
    throw new CreationApiError(code, 'Could not create share link');
  }

  return res.json() as Promise<CreateCreationResponse>;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
