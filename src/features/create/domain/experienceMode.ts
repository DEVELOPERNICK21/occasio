import type { TemplateType } from './types';

export type ExperienceMode = 'story' | 'classic';

export function isInteractiveExperience(
  templateType: TemplateType | null,
): boolean {
  return templateType === 'birthday' || templateType === 'anniversary';
}

/** Effective mode: explicit draft override, else occasion default. */
export function resolveDraftExperienceMode(
  templateType: TemplateType | null,
  experienceMode: ExperienceMode | null | undefined,
): ExperienceMode {
  if (experienceMode === 'story' || experienceMode === 'classic') {
    return experienceMode;
  }
  return isInteractiveExperience(templateType) ? 'story' : 'classic';
}
