export type HistoryErrorCode = 'NOT_AUTHENTICATED' | 'NETWORK' | 'UNKNOWN';

export class HistoryError extends Error {
  constructor(
    public readonly code: HistoryErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'HistoryError';
  }
}
