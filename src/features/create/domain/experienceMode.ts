import type { TemplateType } from './types';

export type ExperienceMode = 'story' | 'classic';

/** All five create-flow moments open as an interactive story by default. */
const STORY_TYPES = new Set<TemplateType>([
  'birthday',
  'anniversary',
  'thank_you',
  'congratulations',
  'just_because',
]);

/** Candle/cake beat — birthday & anniversary only. */
const CANDLE_TYPES = new Set<TemplateType>(['birthday', 'anniversary']);

export function isInteractiveExperience(
  templateType: TemplateType | null,
): boolean {
  return templateType !== null && STORY_TYPES.has(templateType);
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

/** Preview hint — scene list matches the recipient story for this moment. */
export function storyBeatHint(templateType: TemplateType | null): string {
  if (!templateType || !isInteractiveExperience(templateType)) {
    return '';
  }
  if (CANDLE_TYPES.has(templateType)) {
    return 'They’ll open balloons, candle, gift, photos, envelope, letter, then your card.';
  }
  return 'They’ll open balloons, gift, photos, envelope, letter, then your card.';
}
