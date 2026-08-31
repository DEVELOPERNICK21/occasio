import type { TemplateType } from './types';

export type TemplateOption = {
  id: TemplateType;
  label: string;
  description: string;
};

export const TEMPLATE_OPTIONS: TemplateOption[] = [
  { id: 'birthday', label: 'Birthday', description: 'Celebrate their day' },
  { id: 'anniversary', label: 'Anniversary', description: 'Mark the date' },
  { id: 'sorry', label: 'Sorry', description: 'Make it right' },
  { id: 'proposal', label: 'Proposal', description: 'Big moment' },
  { id: 'mothers_day', label: "Mother's Day", description: 'For mom' },
  { id: 'fathers_day', label: "Father's Day", description: 'For dad' },
];
