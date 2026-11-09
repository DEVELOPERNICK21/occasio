export type WebTemplateTheme = {
  label: string;
  kicker: string;
  accent: string;
  accentSecondary: string;
  softBackground: string;
  orbPrimary: string;
  orbSecondary: string;
};

import { HOLIDAY_LOOKS, webHolidayFor } from './holidays';

const THEMES: Record<string, WebTemplateTheme> = {
  birthday: {
    label: 'Birthday',
    kicker: 'Celebrate their day',
    accent: '#E8615D',
    accentSecondary: '#F6A94A',
    softBackground: '#FCEEE8',
    orbPrimary: '#F7C9B6',
    orbSecondary: '#F6A94A',
  },
  anniversary: {
    label: 'Anniversary',
    kicker: 'Mark the date together',
    accent: '#C94E4A',
    accentSecondary: '#E8A4A0',
    softBackground: '#FAE8E8',
    orbPrimary: '#E8A4A0',
    orbSecondary: '#F6A94A',
  },
  sorry: {
    label: 'Sorry',
    kicker: 'Say it with care',
    accent: '#B07A6F',
    accentSecondary: '#D4B8B0',
    softBackground: '#F5EDEA',
    orbPrimary: '#D4B8B0',
    orbSecondary: '#EDD5CA',
  },
  proposal: {
    label: 'Proposal',
    kicker: 'A moment they will remember',
    accent: '#D44D6A',
    accentSecondary: '#F5B8C8',
    softBackground: '#FCE8EE',
    orbPrimary: '#F5B8C8',
    orbSecondary: '#E8615D',
  },
};

const FALLBACK = THEMES.birthday;

/** A festival takes its colour family's five colours, the same ones the app uses. */
function holidayTheme(templateType: string): WebTemplateTheme | null {
  const holiday = webHolidayFor(templateType);
  if (!holiday) return null;
  const { accent, accentSecondary, softBackground, orbPrimary, orbSecondary } = HOLIDAY_LOOKS[holiday.look];
  return {
    label: holiday.label,
    kicker: `A ${holiday.label} wish`,
    accent,
    accentSecondary,
    softBackground,
    orbPrimary,
    orbSecondary,
  };
}

export function getWebTemplateTheme(templateType: string): WebTemplateTheme {
  return THEMES[templateType] ?? holidayTheme(templateType) ?? FALLBACK;
}
