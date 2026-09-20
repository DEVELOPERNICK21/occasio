import type { Audience, Occasion } from './templateSchema';

export type TemplateType =
  | 'birthday'
  | 'anniversary'
  | 'sorry'
  | 'proposal'
  | 'mothers_day'
  | 'fathers_day'
  | 'thank_you'
  | 'congratulations'
  | 'just_because';

export type CreationDraft = {
  templateType: TemplateType | null;
  templateId: string | null;
  audience: Audience | null;
  occasion: Occasion | null;
  photoUris: string[];
  recipientName: string;
  /** Who the card is signed by — an unsigned card arrives anonymous. */
  fromName: string;
  message: string;
  /**
   * Recipient interactive story. Null = default from occasion
   * (birthday/anniversary → story).
   */
  experienceMode: 'story' | 'classic' | null;
  /**
   * Short line for balloon pops (max 8 words). Empty = default
   * "You are so special".
   */
  balloonLine: string;
};

export type Creation = CreationDraft & {
  id: string;
  shareSlug: string;
  shareUrl: string;
  watermarked: boolean;
  createdAt: string;
};

export const EMPTY_CREATION_DRAFT: CreationDraft = {
  templateType: null,
  templateId: null,
  audience: null,
  occasion: null,
  photoUris: [],
  recipientName: '',
  fromName: '',
  message: '',
  experienceMode: null,
  balloonLine: '',
};
