export type TemplateType =
  | 'birthday'
  | 'anniversary'
  | 'sorry'
  | 'proposal'
  | 'mothers_day'
  | 'fathers_day';

export type CreationDraft = {
  templateType: TemplateType | null;
  photoUris: string[];
  recipientName: string;
  message: string;
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
  photoUris: [],
  recipientName: '',
  message: '',
};
