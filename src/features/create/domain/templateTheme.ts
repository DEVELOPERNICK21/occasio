import type { TemplateType } from './types';

export type TemplateTheme = {
  label: string;
  kicker: string;
  /** Short emotional hook on the picker card — honest, not hype. */
  emotionalCue: string;
  /** Validates the user's choice after selection (commitment + autonomy). */
  affirmation: string;
  accent: string;
  accentSecondary: string;
  softBackground: string;
  orbPrimary: string;
  orbSecondary: string;
  /** Ken Burns duration (ms) — slower feels calmer for sorry, faster for celebration. */
  photoPulseMs: number;
};

const THEMES: Record<TemplateType, TemplateTheme> = {
  birthday: {
    label: 'Birthday',
    kicker: 'Celebrate their day',
    emotionalCue: 'Make them feel remembered',
    affirmation: 'A real photo and a few honest words land better than a long message.',
    accent: '#E8615D',
    accentSecondary: '#F6A94A',
    softBackground: '#FCEEE8',
    orbPrimary: '#F7C9B6',
    orbSecondary: '#F6A94A',
    photoPulseMs: 9000,
  },
  anniversary: {
    label: 'Anniversary',
    kicker: 'Mark the date together',
    emotionalCue: 'Honor a chapter you share',
    affirmation: 'Keep it personal — they will open your link in one tap.',
    accent: '#C94E4A',
    accentSecondary: '#E8A4A0',
    softBackground: '#FAE8E8',
    orbPrimary: '#E8A4A0',
    orbSecondary: '#F6A94A',
    photoPulseMs: 11000,
  },
  sorry: {
    label: 'Sorry',
    kicker: 'Say it with care',
    emotionalCue: 'Repair starts with showing up',
    affirmation: 'Simple and sincere beats perfect. You can edit before you share.',
    accent: '#B07A6F',
    accentSecondary: '#D4B8B0',
    softBackground: '#F5EDEA',
    orbPrimary: '#D4B8B0',
    orbSecondary: '#EDD5CA',
    photoPulseMs: 14000,
  },
  proposal: {
    label: 'Proposal',
    kicker: 'A moment they will remember',
    emotionalCue: 'Say what you mean clearly',
    affirmation: 'This is your moment — take the next step when you are ready.',
    accent: '#D44D6A',
    accentSecondary: '#F5B8C8',
    softBackground: '#FCE8EE',
    orbPrimary: '#F5B8C8',
    orbSecondary: '#E8615D',
    photoPulseMs: 8000,
  },
  mothers_day: {
    label: "Mother's Day",
    kicker: 'For mom',
    emotionalCue: 'Gratitude she can revisit',
    affirmation: 'She does not need polish — she needs to hear you.',
    accent: '#E07A8A',
    accentSecondary: '#F7C9B6',
    softBackground: '#FCEEF2',
    orbPrimary: '#F7C9B6',
    orbSecondary: '#F6A94A',
    photoPulseMs: 10000,
  },
  fathers_day: {
    label: "Father's Day",
    kicker: 'For dad',
    emotionalCue: 'Quiet appreciation counts',
    affirmation: 'A steady note from you is enough. Add a photo if you have one.',
    accent: '#5B7A6E',
    accentSecondary: '#A8C4B8',
    softBackground: '#EEF4F1',
    orbPrimary: '#A8C4B8',
    orbSecondary: '#857371',
    photoPulseMs: 10000,
  },
};

const FALLBACK: TemplateTheme = THEMES.birthday;

export function getTemplateTheme(templateType: TemplateType | null): TemplateTheme {
  if (!templateType) return FALLBACK;
  return THEMES[templateType] ?? FALLBACK;
}
