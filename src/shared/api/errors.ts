/**
 * Every error code the API can answer with (the contract is docs-site/content/api-contracts.md).
 * The one list: the type, the check on a server response and the narrower sets features use
 * are all derived from it, so a code is added in exactly one place.
 */
export const HTTP_ERROR_CODES = [
  'VALIDATION_ERROR',
  'QUOTA_EXCEEDED',
  'UPLOAD_MISSING',
  'NOT_FOUND',
  'EXPIRED',
  'UNAUTHORIZED',
  'NOT_IMPLEMENTED',
  'UNDER_AGE',
  'ATTESTATION_INVALID',
  'FREE_CARD_NEEDS_PROVIDER',
  'EMAIL_NOT_ALLOWED',
  'APP_CHECK_FAILED',
  'INTERNAL',
] as const;

export type HttpErrorCode = (typeof HTTP_ERROR_CODES)[number];

export function isHttpErrorCode(value: string): value is HttpErrorCode {
  return (HTTP_ERROR_CODES as readonly string[]).includes(value);
}

export class HttpError extends Error {
  constructor(
    public readonly code: HttpErrorCode,
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export function isHttpError(error: unknown): error is HttpError {
  return error instanceof HttpError;
}
