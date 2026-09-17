import type { ScheduledSendStatus } from '../domain/types';

export type ScheduledSendApiErrorCode =
  | 'NOT_AUTHENTICATED'
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'FORBIDDEN'
  | 'INTERNAL';

export class ScheduledSendApiError extends Error {
  constructor(
    public readonly code: ScheduledSendApiErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'ScheduledSendApiError';
  }
}

export type ReviewSendResult = {
  ok: true;
  id: string;
  status: ScheduledSendStatus;
  shareUrl: string | null;
  deliveryChannelUsed?: string;
};
