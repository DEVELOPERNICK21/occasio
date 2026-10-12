export type SubscriptionTier = 'free' | 'personal' | 'family';

export type OccasionType = 'birthday' | 'anniversary';

export type ScheduledSendStatus =
  | 'pending'
  | 'review'
  | 'approved'
  | 'cancelled'
  | 'sent'
  | 'failed';

export type AutoSendPack = {
  preferredTemplateId: string | null;
  preferredTemplateType: string | null;
  photoRefs: string[];
  defaultMessage: string;
  fromName: string | null;
};

export type RelationshipType =
  | 'mom'
  | 'dad'
  | 'parent'
  | 'partner'
  | 'sibling'
  | 'friend'
  | 'colleague'
  | 'other';

export type PersonDate = {
  month: number;
  day: number;
};

export type VaultPerson = {
  id: string;
  userId: string;
  personName: string;
  relationshipType: RelationshipType;
  birthday: PersonDate | null;
  anniversary: PersonDate | null;
  whatsapp: string | null;
  email: string | null;
  /** The sender recorded that this person agreed to get cards by email. */
  emailConsent?: boolean;
  autoSendBirthday: boolean;
  autoSendAnniversary: boolean;
  pack: AutoSendPack | null;
  lastCreationId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PersonDraft = {
  personName: string;
  relationshipType: RelationshipType | null;
  birthdayMonth: string;
  birthdayDay: string;
  anniversaryMonth: string;
  anniversaryDay: string;
  whatsapp: string;
  email: string;
  emailConsent: boolean;
};

export type CreatePersonInput = {
  personName: string;
  relationshipType: RelationshipType;
  birthday: PersonDate | null;
  anniversary: PersonDate | null;
  whatsapp: string | null;
  email: string | null;
  emailConsent: boolean;
  autoSendBirthday: boolean;
  autoSendAnniversary: boolean;
};

export const EMPTY_PERSON_DRAFT: PersonDraft = {
  personName: '',
  relationshipType: null,
  birthdayMonth: '',
  birthdayDay: '',
  anniversaryMonth: '',
  anniversaryDay: '',
  whatsapp: '',
  email: '',
  emailConsent: false,
};
