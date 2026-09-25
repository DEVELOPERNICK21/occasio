import type { Audience, Occasion } from './templateSchema';
import type { TemplateType } from './types';

export const AUDIENCE_OPTIONS: {
  id: Audience;
  label: string;
  /** Short emotional cue — helps choose, not hype. */
  cue: string;
}[] = [
  { id: 'someone_special', label: 'Someone special', cue: 'They crossed your mind' },
  { id: 'mom', label: 'Mom', cue: 'The one who always listens' },
  { id: 'dad', label: 'Dad', cue: 'Fewer words, more meaning' },
  { id: 'friend', label: 'Best friend', cue: 'Say what you never text' },
  { id: 'partner', label: 'Partner', cue: 'Only you would send this' },
  { id: 'family', label: 'Family', cue: 'Keep the thread warm' },
];

export const OCCASION_OPTIONS: {
  id: Occasion;
  label: string;
}[] = [
  { id: 'birthday', label: 'Birthday' },
  { id: 'anniversary', label: 'Anniversary' },
  { id: 'thank_you', label: 'Thank you' },
  { id: 'congratulations', label: 'Congratulations' },
  { id: 'just_because', label: 'Just because' },
];

export function audienceLabel(audience: Audience | null): string | null {
  if (!audience) return null;
  return AUDIENCE_OPTIONS.find((o) => o.id === audience)?.label ?? null;
}

export function occasionToTemplateType(occasion: Occasion): TemplateType {
  return occasion;
}

const OCCASION_HEADLINES: Record<Occasion, string> = {
  birthday: 'Happy Birthday',
  anniversary: 'Happy Anniversary',
  thank_you: 'Thank you',
  congratulations: 'Congratulations',
  just_because: 'Just because',
};

/** Headline the card will actually render for this moment. */
export function occasionHeadline(occasion: Occasion | null): string | null {
  if (!occasion) return null;
  return OCCASION_HEADLINES[occasion];
}

export function defaultTemplateIdForType(templateType: TemplateType): string {
  switch (templateType) {
    case 'birthday':
    case 'mothers_day':
    case 'fathers_day':
      return 'B10';
    case 'thank_you':
    case 'congratulations':
      return 'T01';
    case 'just_because':
      return 'L06';
    case 'anniversary':
    case 'sorry':
    case 'proposal':
      return 'B01';
  }
}

export function occasionFromTemplateType(
  templateType: TemplateType,
): Occasion | null {
  if (
    templateType === 'birthday' ||
    templateType === 'anniversary' ||
    templateType === 'thank_you' ||
    templateType === 'congratulations' ||
    templateType === 'just_because'
  ) {
    return templateType;
  }
  return null;
}

/** Map home-grid occasion cards into draft audience/occasion for the post-home flow. */
export function homeSelectionFromTemplateType(templateType: TemplateType): {
  occasion: Occasion;
  audience: Audience | null;
} {
  if (templateType === 'mothers_day') {
    return { occasion: 'birthday', audience: 'mom' };
  }
  if (templateType === 'fathers_day') {
    return { occasion: 'birthday', audience: 'dad' };
  }
  const occasion = occasionFromTemplateType(templateType);
  if (occasion) {
    return { occasion, audience: null };
  }
  // Legacy sorry / proposal → closest catalog occasion
  return { occasion: 'just_because', audience: null };
}
