export type OccasionType = 'birthday' | 'anniversary';

export type ScheduledSendStatus =
  | 'pending'
  | 'review'
  | 'approved'
  | 'cancelled'
  | 'sent'
  | 'failed';

export type SubscriptionTier = 'free' | 'personal' | 'family';

export type PersonDate = {
  month: number;
  day: number;
};

export type AutoSendPack = {
  preferredTemplateId: string | null;
  preferredTemplateType: string | null;
  photoRefs: string[];
  defaultMessage: string;
  fromName: string | null;
};

export type AutoSendLastCreation = {
  templateType: string;
  templateId: string;
  photoRefs: string[];
  /** Display URLs (inline data URLs or hosted). Empty for storage-only creations. */
  mediaUrls?: string[];
  message: string;
  fromName: string | null;
};

export type AutoSendContentSource = 'pack' | 'last_creation' | 'default';

export type ResolvedAutoSendContent = {
  templateType: string;
  templateId: string | null;
  photoRefs: string[];
  /** Display URLs already known for these photos; cron resolves the rest from storage paths. */
  mediaUrls: string[];
  message: string;
  fromName: string | null;
  source: AutoSendContentSource;
};

export type ResolveAutoSendContentInput = {
  occasionType: OccasionType;
  pack: AutoSendPack | null;
  lastCreation: AutoSendLastCreation | null;
};

export type IstCalendarDate = {
  year: number;
  month: number;
  day: number;
};

export type RelationshipRecord = {
  id: string;
  userId: string;
  personName: string;
  dates?: {
    birthday?: PersonDate;
    anniversary?: PersonDate;
  };
  autoSendEnabled?: {
    birthday?: boolean;
    anniversary?: boolean;
  };
  preferredTemplateId?: string | null;
  preferredTemplateType?: string | null;
  photoRefs?: string[];
  defaultMessage?: string;
  fromName?: string | null;
  lastCreationId?: string;
};

export type DeliveryChannel = 'whatsapp' | 'sms' | 'email';

export function isPaidAutosendTier(tier: unknown): boolean {
  return tier === 'personal' || tier === 'family';
}

export function isAutosendDispatchEnabled(): boolean {
  return process.env.OCCASIO_AUTOSEND_DISPATCH === 'true';
}

/** Refs like `inline:0` point at nothing once the source draft is gone. */
export function isInlinePhotoRef(ref: string): boolean {
  return /^inline:\d+$/.test(ref);
}

/**
 * A card is only sendable when the recipient page can actually show a photo:
 * either display URLs exist, or a ref points at real storage (not `inline:N`).
 */
export function hasCreationPhotos(
  photoRefs: unknown,
  mediaUrls: unknown,
): boolean {
  if (nonEmptyStrings(mediaUrls).length > 0) {
    return true;
  }
  return nonEmptyStrings(photoRefs).some((ref) => !isInlinePhotoRef(ref));
}

export function shouldAutoDispatchOnDeadline(
  hasPhotos: boolean,
  reviewExpired: boolean,
): 'dispatch' | 'incomplete_pack' | 'wait' {
  if (!reviewExpired) return 'wait';
  if (hasPhotos) return 'dispatch';
  return 'incomplete_pack';
}

export function isReviewExpired(reviewDeadline: Date | null, now: Date): boolean {
  if (!reviewDeadline) return false;
  return now.getTime() > reviewDeadline.getTime();
}

function nonEmptyStrings(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter(
    (item): item is string => typeof item === 'string' && item.length > 0,
  );
}
