import { isDataUrl, isDataUrlWithinLimit } from '../domain/base64Media';
import { CreationApiError } from './types';

/**
 * Read a local file URI as a JPEG data URL.
 * Prefer `includeBase64` from image-picker when possible.
 */
export async function fileUriToDataUrl(uri: string): Promise<string> {
  const response = await fetch(uri);
  const buffer = await response.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = globalThis.btoa(binary);
  return `data:image/jpeg;base64,${base64}`;
}

export async function toDataUrl(uri: string): Promise<string> {
  if (isDataUrl(uri)) {
    return uri;
  }
  return fileUriToDataUrl(uri);
}

export function assertDataUrlFits(dataUrl: string): void {
  if (!isDataUrlWithinLimit(dataUrl)) {
    throw new CreationApiError(
      'VALIDATION_ERROR',
      'Photo is too large. Try a smaller image or fewer photos.',
    );
  }
}
