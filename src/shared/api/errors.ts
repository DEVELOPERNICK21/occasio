export type HttpErrorCode =
  | 'VALIDATION_ERROR'
  | 'QUOTA_EXCEEDED'
  | 'UPLOAD_MISSING'
  | 'NOT_FOUND'
  | 'EXPIRED'
  | 'UNAUTHORIZED'
  | 'NOT_IMPLEMENTED'
  | 'UNDER_AGE'
  | 'ATTESTATION_INVALID'
  | 'EMAIL_NOT_VERIFIED'
  | 'EMAIL_NOT_ALLOWED'
  | 'INTERNAL';

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
