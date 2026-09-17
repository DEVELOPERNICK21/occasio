import type { TemplateType } from './types';

export function isInteractiveExperience(
  templateType: TemplateType | null,
): boolean {
  return templateType === 'birthday' || templateType === 'anniversary';
}
