import { MAX_BASE64_DATA_URL_CHARS } from '../../../shared/config/media';

export function isDataUrl(uri: string): boolean {
  return uri.startsWith('data:image/');
}

export function dataUrlByteBudget(dataUrl: string): number {
  return dataUrl.length;
}

export function isDataUrlWithinLimit(dataUrl: string): boolean {
  return dataUrlByteBudget(dataUrl) <= MAX_BASE64_DATA_URL_CHARS;
}
