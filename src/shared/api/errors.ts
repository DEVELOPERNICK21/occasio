export type HttpErrorCode =
  | 'VALIDATION_ERROR'
  | 'QUOTA_EXCEEDED'
  | 'UPLOAD_MISSING'
  | 'NOT_FOUND'
  | 'EXPIRED'
  | 'NOT_IMPLEMENTED'
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
