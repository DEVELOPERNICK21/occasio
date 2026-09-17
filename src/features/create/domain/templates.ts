import type { TemplateType } from './types';

export type TemplateOption = {
  id: TemplateType;
  label: string;
};

/**
 * Display labels for every occasion the app has ever written to a draft.
 * Legacy values stay so old history entries and share links keep their label —
 * the create flow only offers the occasions in `OCCASION_OPTIONS`.
 */
export const TEMPLATE_OPTIONS: TemplateOption[] = [
  { id: 'birthday', label: 'Birthday' },
  { id: 'anniversary', label: 'Anniversary' },
  { id: 'sorry', label: 'Sorry' },
  { id: 'proposal', label: 'Proposal' },
  { id: 'mothers_day', label: "Mother's Day" },
  { id: 'fathers_day', label: "Father's Day" },
  { id: 'thank_you', label: 'Thank you' },
  { id: 'congratulations', label: 'Congratulations' },
  { id: 'just_because', label: 'Just because' },
];

export function templateLabel(templateType: TemplateType | null): string {
  if (!templateType) return 'Special wish';
  return TEMPLATE_OPTIONS.find((t) => t.id === templateType)?.label ?? 'Special wish';
}

export function wishGreeting(templateType: TemplateType | null): string {
  switch (templateType) {
    case 'sorry':
      return 'Thinking of you,';
    case 'proposal':
      return 'For you,';
    case 'anniversary':
      return 'Happy anniversary,';
    case 'thank_you':
      return 'Thank you,';
    case 'congratulations':
      return 'Congratulations,';
    case 'just_because':
      return 'For you,';
    default:
      return `Happy ${templateLabel(templateType)},`;
  }
}
