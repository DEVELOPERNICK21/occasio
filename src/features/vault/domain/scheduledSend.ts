import type { OccasionType, ScheduledSendStatus } from './types';

export type { OccasionType, ScheduledSendStatus };

export const REVIEW_NO_PHOTOS_COPY =
  'Add photos via Save for auto-send or cancel';

const ALLOWED_TRANSITIONS: Record<
  ScheduledSendStatus,
  readonly ScheduledSendStatus[]
> = {
  pending: ['review', 'failed'],
  review: ['approved', 'cancelled', 'failed'],
  approved: ['sent', 'failed'],
  cancelled: [],
  sent: [],
  failed: [],
};

export function buildIdempotencyKey(
  userId: string,
  relationshipId: string,
  occasionType: OccasionType,
  year: number,
): string {
  return `${userId}_${relationshipId}_${occasionType}_${year}`;
}

export function canTransition(
  from: ScheduledSendStatus,
  to: ScheduledSendStatus,
): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function isReviewExpired(
  reviewDeadlineIso: string,
  now: Date,
): boolean {
  return now.getTime() > new Date(reviewDeadlineIso).getTime();
}

export function shouldAutoDispatchOnDeadline(
  hasPhotos: boolean,
  reviewExpired: boolean,
): 'dispatch' | 'incomplete_pack' | 'wait' {
  if (!reviewExpired) return 'wait';
  if (hasPhotos) return 'dispatch';
  return 'incomplete_pack';
}

export function occasionLabel(type: OccasionType): string {
  return type === 'birthday' ? 'Birthday' : 'Anniversary';
}

export function formatReviewDeadline(
  reviewDeadlineIso: string,
  now = new Date(),
): string {
  if (!reviewDeadlineIso) {
    return 'Review window open';
  }

  const end = Date.parse(reviewDeadlineIso);
  if (Number.isNaN(end)) {
    return 'Review window open';
  }

  const ms = end - now.getTime();
  if (ms <= 0) {
    return 'Review window ended';
  }

  const totalMinutes = Math.floor(ms / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours >= 48) {
    const days = Math.floor(hours / 24);
    return `${days} days left to review`;
  }
  if (hours >= 24) {
    return '1 day left to review';
  }
  if (hours >= 1) {
    return hours === 1 ? '1 hour left to review' : `${hours} hours left to review`;
  }
  if (minutes <= 1) {
    return 'Less than a minute left to review';
  }
  return `${minutes} minutes left to review`;
}

/**
 * Pack photo count when known. `null` means last-card / generated creation
 * may still have photos the client has not loaded — allow approve and let
 * the server reject.
 */
export function resolveReviewPhotoCount(input: {
  packPhotoCount?: number | null;
  lastCreationId?: string | null;
  shareUrl: string | null;
  generatedCreationId: string | null;
}): number | null {
  const packCount = input.packPhotoCount ?? null;
  if (packCount != null && packCount > 0) {
    return packCount;
  }
  if (input.lastCreationId || input.shareUrl || input.generatedCreationId) {
    return null;
  }
  if (packCount === 0) {
    return 0;
  }
  return null;
}

export function canApproveScheduledSend(photoCount: number | null): boolean {
  return photoCount !== 0;
}

export function formatPhotoCountLabel(photoCount: number | null): string {
  if (photoCount === null) {
    return 'Photos will be checked when you approve';
  }
  if (photoCount === 0) {
    return 'No photos on this card yet';
  }
  return photoCount === 1 ? '1 photo' : `${photoCount} photos`;
}
