import { holidayById, isHolidayId } from './holidays';
import type { BaseTemplateType, TemplateType } from './types';

export type TemplateOption = {
  id: BaseTemplateType;
  label: string;
};

/**
 * Display labels for the everyday card types, including the legacy ones (sorry, proposal) that old
 * history entries and share links may carry. The create flow only offers the occasions in
 * `OCCASION_OPTIONS`, and the festivals in `holidays.ts`, which add their own labels.
 */
export const TEMPLATE_OPTIONS: TemplateOption[] = [
  { id: 'birthday', label: 'Birthday' },
  { id: 'anniversary', label: 'Anniversary' },
  { id: 'sorry', label: 'Sorry' },
  { id: 'proposal', label: 'Proposal' },
  { id: 'thank_you', label: 'Thank you' },
  { id: 'congratulations', label: 'Congratulations' },
  { id: 'just_because', label: 'Just because' },
  { id: 'invitation', label: 'Invitation' },
];

const BASE_TYPE_IDS: ReadonlySet<string> = new Set(TEMPLATE_OPTIONS.map((t) => t.id));

/** Whether a stored or received string is a card type the app knows. */
export function parseTemplateType(value: unknown): TemplateType | null {
  if (typeof value !== 'string') return null;
  return BASE_TYPE_IDS.has(value) || isHolidayId(value) ? (value as TemplateType) : null;
}

/** The display name of a card type. `fallback` is what an unknown or missing type is called. */
export function templateLabel(templateType: string | null, fallback = 'Special wish'): string {
  if (!templateType) return fallback;
  return (
    TEMPLATE_OPTIONS.find((t) => t.id === templateType)?.label ??
    holidayById(templateType)?.label ??
    fallback
  );
}

export function wishGreeting(templateType: TemplateType | null): string {
  const holiday = holidayById(templateType);
  if (holiday) return holiday.greeting;
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
