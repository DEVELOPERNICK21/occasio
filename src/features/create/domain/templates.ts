import type { TemplateType } from './types';

export type TemplateOption = {
  id: TemplateType;
  label: string;
  /** Single-letter fallback for accessibility / compact UI. */
  initial: string;
  /** Picker tile — warm emoji mark (occasion picker only). */
  emoji: string;
  /** Short line under the label on the picker grid. */
  tagline: string;
};

export const TEMPLATE_OPTIONS: TemplateOption[] = [
  {
    id: 'birthday',
    label: 'Birthday',
    initial: 'B',
    emoji: '🎂',
    tagline: 'Celebrate their day',
  },
  {
    id: 'anniversary',
    label: 'Anniversary',
    initial: 'A',
    emoji: '💍',
    tagline: 'Mark the date',
  },
  {
    id: 'sorry',
    label: 'Sorry',
    initial: 'S',
    emoji: '💐',
    tagline: 'Make it right',
  },
  {
    id: 'proposal',
    label: 'Proposal',
    initial: 'P',
    emoji: '✨',
    tagline: 'Big moment',
  },
  {
    id: 'mothers_day',
    label: "Mother's Day",
    initial: 'M',
    emoji: '🌸',
    tagline: 'For mom',
  },
  {
    id: 'fathers_day',
    label: "Father's Day",
    initial: 'F',
    emoji: '🌿',
    tagline: 'For dad',
  },
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
    default:
      return `Happy ${templateLabel(templateType)},`;
  }
}
