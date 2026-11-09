import type { BillingErrorCode } from '../domain/billingNotice';

export type { BillingErrorCode };

/**
 * `message` is for logs and developers. What a person reads comes from `describeBillingNotice(code)`,
 * so an SDK's own wording ("error 20") never reaches the screen.
 */
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

/**
 * RevenueCat's `PURCHASES_ERROR_CODE` values. Written out here, not imported, so this mapping is plain
 * logic that can be tested without the SDK. A code that is not listed is `INTERNAL`.
 */
const SDK_CODES: Record<string, BillingErrorCode> = {
  '1': 'CANCELLED', // PURCHASE_CANCELLED_ERROR
  '2': 'STORE', // STORE_PROBLEM_ERROR
  '3': 'NOT_ALLOWED', // PURCHASE_NOT_ALLOWED_ERROR
  '4': 'PAYMENT_PROBLEM', // PURCHASE_INVALID_ERROR
  '5': 'UNAVAILABLE', // PRODUCT_NOT_AVAILABLE_FOR_PURCHASE_ERROR
  '6': 'ALREADY_OWNED', // PRODUCT_ALREADY_PURCHASED_ERROR
  '7': 'OTHER_ACCOUNT', // RECEIPT_ALREADY_IN_USE_ERROR
  '10': 'NETWORK', // NETWORK_ERROR
  '13': 'OTHER_ACCOUNT', // RECEIPT_IN_USE_BY_OTHER_SUBSCRIBER_ERROR
  '15': 'BUSY', // OPERATION_ALREADY_IN_PROGRESS_ERROR
  '18': 'INELIGIBLE', // INELIGIBLE_ERROR
  '20': 'PENDING', // PAYMENT_PENDING_ERROR: the store has not confirmed the payment yet
  '32': 'STORE', // PRODUCT_REQUEST_TIMED_OUT_ERROR
  '33': 'NETWORK', // API_ENDPOINT_BLOCKED
  '35': 'NETWORK', // OFFLINE_CONNECTION_ERROR
};

const SDK_NAMES: Record<string, BillingErrorCode> = {
  PURCHASE_CANCELLED_ERROR: 'CANCELLED',
  STORE_PROBLEM_ERROR: 'STORE',
  PURCHASE_NOT_ALLOWED_ERROR: 'NOT_ALLOWED',
  PURCHASE_INVALID_ERROR: 'PAYMENT_PROBLEM',
  PRODUCT_NOT_AVAILABLE_FOR_PURCHASE_ERROR: 'UNAVAILABLE',
  PRODUCT_ALREADY_PURCHASED_ERROR: 'ALREADY_OWNED',
  RECEIPT_ALREADY_IN_USE_ERROR: 'OTHER_ACCOUNT',
  NETWORK_ERROR: 'NETWORK',
  RECEIPT_IN_USE_BY_OTHER_SUBSCRIBER_ERROR: 'OTHER_ACCOUNT',
  OPERATION_ALREADY_IN_PROGRESS_ERROR: 'BUSY',
  INELIGIBLE_ERROR: 'INELIGIBLE',
  PAYMENT_PENDING_ERROR: 'PENDING',
  PRODUCT_REQUEST_TIMED_OUT_ERROR: 'STORE',
  API_ENDPOINT_BLOCKED: 'NETWORK',
  OFFLINE_CONNECTION_ERROR: 'NETWORK',
};

/** What a thrown purchase or restore error means, whichever shape the SDK gave it. */
export function billingErrorFromSdk(error: unknown): BillingError {
  if (error instanceof BillingError) {
    return error;
  }
  if (isPurchaseCancelled(error)) {
    return new BillingError('CANCELLED', 'Purchase cancelled.');
  }

  const raw = error && typeof error === 'object' ? (error as Record<string, unknown>) : null;
  const text = error instanceof Error ? error.message : 'Billing failed.';
  if (raw) {
    const byCode = 'code' in raw ? SDK_CODES[String(raw.code)] : undefined;
    const byName =
      typeof raw.readableErrorCode === 'string' ? SDK_NAMES[raw.readableErrorCode] : undefined;
    const code = byCode ?? byName;
    if (code) {
      return new BillingError(code, text);
    }
  }
  return new BillingError('INTERNAL', text);
}
