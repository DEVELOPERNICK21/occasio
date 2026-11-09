import { HOLIDAYS, holidayById, type HolidayLook } from './holidays';
import type { BaseTemplateType, TemplateType } from './types';

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

const THEMES: Record<BaseTemplateType, TemplateTheme> = {
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
  thank_you: {
    label: 'Thank you',
    kicker: 'Show your appreciation',
    emotionalCue: 'Let them know it mattered',
    affirmation: 'A specific memory makes gratitude feel personal.',
    accent: '#E8615D',
    accentSecondary: '#F6A94A',
    softBackground: '#FCEEE8',
    orbPrimary: '#F7C9B6',
    orbSecondary: '#F6A94A',
    photoPulseMs: 11000,
  },
  congratulations: {
    label: 'Congratulations',
    kicker: 'Mark their moment',
    emotionalCue: 'Celebrate what they achieved',
    affirmation: 'A few honest words can make this moment last.',
    accent: '#C94E4A',
    accentSecondary: '#E8A4A0',
    softBackground: '#FAE8E8',
    orbPrimary: '#E8A4A0',
    orbSecondary: '#F6A94A',
    photoPulseMs: 9000,
  },
  just_because: {
    label: 'Just because',
    kicker: 'Send a thoughtful note',
    emotionalCue: 'Small gestures stay with people',
    affirmation: 'You do not need an occasion to make someone feel remembered.',
    accent: '#5B7A6E',
    accentSecondary: '#A8C4B8',
    softBackground: '#EEF4F1',
    orbPrimary: '#A8C4B8',
    orbSecondary: '#857371',
    photoPulseMs: 12000,
  },
  invitation: {
    label: 'Invitation',
    kicker: 'Invite everyone at once',
    emotionalCue: 'One link, the whole plan',
    affirmation: 'Guests reply to you on WhatsApp. Nothing about them is stored here.',
    accent: '#2F6B58',
    accentSecondary: '#C9A54B',
    softBackground: '#EEF3EC',
    orbPrimary: '#CFE0D6',
    orbSecondary: '#E9D9A6',
    photoPulseMs: 10000,
  },
};

/**
 * The colour families of the festivals. Five colours each, the same five every other theme has:
 * the accent, a second colour, the soft card wash, and the two soft orbs behind it. The web page
 * keeps an identical copy in `docs-site/src/lib/holidays.ts`, and a test keeps them equal.
 */
type Palette = Pick<TemplateTheme, 'accent' | 'accentSecondary' | 'softBackground' | 'orbPrimary' | 'orbSecondary'>;

const LOOKS: Record<HolidayLook, Palette> = {
  diya: { accent: '#C9741A', accentSecondary: '#F2B33D', softBackground: '#FDF0DA', orbPrimary: '#F6D28D', orbSecondary: '#E8A13A' },
  colour: { accent: '#D63A73', accentSecondary: '#F4A100', softBackground: '#FDEAF2', orbPrimary: '#F6B9D0', orbSecondary: '#FFD36B' },
  night: { accent: '#CF5E17', accentSecondary: '#4B4540', softBackground: '#FBEFE4', orbPrimary: '#F4B07A', orbSecondary: '#9A948C' },
  evergreen: { accent: '#B23A36', accentSecondary: '#2F6B4F', softBackground: '#FBEEEB', orbPrimary: '#E8A9A5', orbSecondary: '#9CC7AF' },
  sky: { accent: '#2F6FA3', accentSecondary: '#8DBBDD', softBackground: '#EBF3FA', orbPrimary: '#BAD6EC', orbSecondary: '#E8D8A0' },
  crescent: { accent: '#1F7A6B', accentSecondary: '#C9A54B', softBackground: '#E8F4F1', orbPrimary: '#A8D5CB', orbSecondary: '#E9D9A6' },
  tricolour: { accent: '#D9701C', accentSecondary: '#2E7D4F', softBackground: '#FFF2E2', orbPrimary: '#F5C48D', orbSecondary: '#A3D1B4' },
  romance: { accent: '#D44D6A', accentSecondary: '#F5B8C8', softBackground: '#FCE8EE', orbPrimary: '#F5B8C8', orbSecondary: '#E8615D' },
  harvest: { accent: '#B9831A', accentSecondary: '#7C9D3F', softBackground: '#FBF2DA', orbPrimary: '#EFD488', orbSecondary: '#B9D08B' },
  spring: { accent: '#B8921A', accentSecondary: '#86AE6D', softBackground: '#FAF5D8', orbPrimary: '#EFDF86', orbSecondary: '#CBE2B5' },
  celebrate: { accent: '#34439A', accentSecondary: '#D4AE47', softBackground: '#EDEFFA', orbPrimary: '#B7C0EC', orbSecondary: '#EAD08A' },
  devotion: { accent: '#BF5518', accentSecondary: '#E1A62E', softBackground: '#FBEDDD', orbPrimary: '#F0B087', orbSecondary: '#E6C268' },
  blush: { accent: '#E07A8A', accentSecondary: '#F7C9B6', softBackground: '#FCEEF2', orbPrimary: '#F7C9B6', orbSecondary: '#F6A94A' },
  sage: { accent: '#5B7A6E', accentSecondary: '#A8C4B8', softBackground: '#EEF4F1', orbPrimary: '#A8C4B8', orbSecondary: '#857371' },
  lantern: { accent: '#BC3B2B', accentSecondary: '#DFB03F', softBackground: '#FCEDE6', orbPrimary: '#EEA89C', orbSecondary: '#EAD08A' },
};

const HOLIDAY_AFFIRMATION = 'A real photo and a few honest words land better than a forwarded message.';

const HOLIDAY_THEMES: ReadonlyMap<string, TemplateTheme> = new Map(
  HOLIDAYS.map((holiday) => [
    holiday.id,
    {
      label: holiday.label,
      kicker: `A ${holiday.label} wish`,
      emotionalCue: holiday.cue,
      affirmation: HOLIDAY_AFFIRMATION,
      ...LOOKS[holiday.look],
      photoPulseMs: 10000,
    },
  ]),
);

const FALLBACK: TemplateTheme = THEMES.birthday;

export function getTemplateTheme(templateType: TemplateType | null): TemplateTheme {
  if (!templateType) return FALLBACK;
  return THEMES[templateType as BaseTemplateType] ?? HOLIDAY_THEMES.get(templateType) ?? FALLBACK;
}

/** The palette of a colour family, for the pieces that draw a festival without a full theme. */
export function holidayPalette(look: HolidayLook): Palette {
  return LOOKS[look];
}

/** The theme of a festival card type, or null for any other card type. */
export function holidayTheme(templateType: string | null): TemplateTheme | null {
  return holidayById(templateType) ? (HOLIDAY_THEMES.get(templateType as string) ?? null) : null;
}
