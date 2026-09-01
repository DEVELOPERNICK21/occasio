export type VaultErrorCode =
  | 'NOT_AUTHENTICATED'
  | 'PERSON_CAP_REACHED'
  | 'VALIDATION'
  | 'NETWORK'
  | 'UNKNOWN';

export class VaultError extends Error {
  constructor(
    public readonly code: VaultErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'VaultError';
  }
}
