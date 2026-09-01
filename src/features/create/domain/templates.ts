import type { TemplateType } from './types';

export type TemplateOption = {
  id: TemplateType;
  label: string;
  description: string;
  emoji: string;
};

export const TEMPLATE_OPTIONS: TemplateOption[] = [
  { id: 'birthday', label: 'Birthday', description: 'Celebrate their day', emoji: '🎂' },
  { id: 'anniversary', label: 'Anniversary', description: 'Mark the date', emoji: '💍' },
  { id: 'sorry', label: 'Sorry', description: 'Make it right', emoji: '💐' },
  { id: 'proposal', label: 'Proposal', description: 'Big moment', emoji: '✨' },
  { id: 'mothers_day', label: "Mother's Day", description: 'For mom', emoji: '🌸' },
  { id: 'fathers_day', label: "Father's Day", description: 'For dad', emoji: '🌿' },
];
