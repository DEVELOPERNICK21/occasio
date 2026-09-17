export type BillingErrorCode =
  | 'NOT_CONFIGURED'
  | 'CANCELLED'
  | 'NETWORK'
  | 'STORE'
  | 'INTERNAL';

export class BillingError extends Error {
  readonly code: BillingErrorCode;

  constructor(code: BillingErrorCode, message: string) {
    super(message);
    this.name = 'BillingError';
    this.code = code;
  }
}

export function isBillingError(error: unknown): error is BillingError {
  return error instanceof BillingError;
}

export function isPurchaseCancelled(error: unknown): boolean {
  if (error instanceof BillingError) {
    return error.code === 'CANCELLED';
  }
  if (error && typeof error === 'object' && 'userCancelled' in error) {
    return Boolean((error as { userCancelled?: boolean }).userCancelled);
  }
  return false;
}
