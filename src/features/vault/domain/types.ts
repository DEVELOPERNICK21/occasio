export type SubscriptionTier = 'free' | 'personal' | 'family';

export type RelationshipType =
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
  whatsapp: string | null;
  autoSendBirthday: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PersonDraft = {
  personName: string;
  relationshipType: RelationshipType | null;
  birthdayMonth: string;
  birthdayDay: string;
  whatsapp: string;
};

export type CreatePersonInput = {
  personName: string;
  relationshipType: RelationshipType;
  birthday: PersonDate | null;
  whatsapp: string | null;
  autoSendBirthday: boolean;
};

export const EMPTY_PERSON_DRAFT: PersonDraft = {
  personName: '',
  relationshipType: null,
  birthdayMonth: '',
  birthdayDay: '',
  whatsapp: '',
};
