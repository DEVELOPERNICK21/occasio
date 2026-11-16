import {
  EASTER,
  calendarDayOf,
  datesIn,
  daysBetween,
  fixed,
  formatCalendarDay,
  listed,
  nthWeekday,
  type CalendarDay,
  type DateRule,
} from './holidayDates';
import type { Audience, Occasion } from './templateSchema';

/**
 * Every festival and holiday a card can be made for. This list is the one source: the picker, the
 * theme, the greeting, the opening lines, the recipient page and the countdown all read from it, so
 * adding a festival is one entry here (plus its web twin in `docs-site/src/lib/holidays.ts`, which a
 * test keeps identical).
 *
 * A festival is a card type, like `birthday`: the card keeps working after the day has passed.
 * Words are calm on purpose (no emoji, no exclamation marks) and never claim more than the day means.
 */

/** The five celebration effects the app has artwork for. */
export type HolidayEffect = 'balloons' | 'hearts' | 'confetti' | 'sparkles' | 'celebration';

/** Which colour family a festival uses. The colours themselves live in `templateTheme.ts`. */
export type HolidayLook =
  | 'diya'
  | 'colour'
  | 'night'
  | 'evergreen'
  | 'sky'
  | 'crescent'
  | 'tricolour'
  | 'romance'
  | 'harvest'
  | 'spring'
  | 'celebrate'
  | 'devotion'
  | 'blush'
  | 'sage'
  | 'lantern';

/** Icon names; `TemplateOccasionIcon` turns each into a drawing. */
export type HolidayIcon =
  | 'party'
  | 'heart'
  | 'flower'
  | 'egg'
  | 'shield'
  | 'users'
  | 'ghost'
  | 'wheat'
  | 'tree'
  | 'star'
  | 'lamp'
  | 'flag'
  | 'graduation'
  | 'baby'
  | 'flame'
  | 'sun'
  | 'sprout'
  | 'sunrise'
  | 'sparkles'
  | 'moon'
  | 'palette'
  | 'handHeart'
  | 'book'
  | 'bell';

export type HolidayGroup =
  | 'hindu'
  | 'new_year'
  | 'national'
  | 'muslim'
  | 'christian'
  | 'dharmic'
  | 'world'
  | 'jewish';

/** The sections of the festival list, in the order they are shown. */
export const HOLIDAY_GROUPS: readonly { id: HolidayGroup; title: string }[] = [
  { id: 'hindu', title: 'Hindu festivals' },
  { id: 'new_year', title: 'New years and harvest' },
  { id: 'national', title: 'National days' },
  { id: 'muslim', title: 'Eid and Ramadan' },
  { id: 'christian', title: 'Christian' },
  { id: 'dharmic', title: 'Sikh, Buddhist and Jain' },
  { id: 'world', title: 'Around the world' },
  { id: 'jewish', title: 'Jewish' },
];

type HolidayDef = {
  id: string;
  label: string;
  group: HolidayGroup;
  look: HolidayLook;
  /** The everyday moment this festival is framed as, so the photo frames and ranking still apply. */
  frame: Occasion;
  effect: HolidayEffect;
  icon: HolidayIcon;
  rule: DateRule;
  /** One honest line on the list. */
  cue: string;
  /** The first opening line, ending mid-sentence so the sender finishes it in their own words. */
  opener: string;
  /** Said at the top of the card. Defaults to "Happy <label>". */
  headline?: string;
  /** Who it is usually for, used when the sender has not said. */
  audience?: Audience;
  /** Allowed to be suggested on Home. The list screen always shows every festival. */
  featured?: true;
};

/* The festivals. Moon festivals list 2026, 2027, 2028, 2029, 2030 in that order. */
const DEFS = [
  // Hindu festivals
  {
    id: 'maha_shivratri', label: 'Maha Shivratri', group: 'hindu', look: 'devotion', frame: 'just_because',
    effect: 'sparkles', icon: 'moon', cue: 'A night of stillness and devotion',
    opener: 'Om Namah Shivaya. May you find ',
    rule: listed('02-15', '03-06', '02-23', '02-11', '03-02'),
  },
  {
    id: 'holi', label: 'Holi', group: 'hindu', look: 'colour', frame: 'just_because',
    effect: 'confetti', icon: 'palette', cue: 'Colour, laughter and old friends',
    opener: 'May your Holi be full of colour, and ',
    rule: listed('03-04', '03-22', '03-11', '03-01', '03-20'), featured: true,
  },
  {
    id: 'ram_navami', label: 'Ram Navami', group: 'hindu', look: 'devotion', frame: 'just_because',
    effect: 'sparkles', icon: 'sun', cue: 'A day of faith and peace',
    opener: 'May this day bring you peace, and ',
    rule: listed('03-26', '04-15', '04-03', '04-22', '04-12'),
  },
  {
    id: 'hanuman_jayanti', label: 'Hanuman Jayanti', group: 'hindu', look: 'devotion', frame: 'just_because',
    effect: 'sparkles', icon: 'flame', cue: 'For strength and steady faith',
    opener: 'May you always have the strength to ',
    rule: listed('04-02', '04-20', '04-09', '04-28', '04-18'),
  },
  {
    id: 'raksha_bandhan', label: 'Raksha Bandhan', group: 'hindu', look: 'blush', frame: 'just_because',
    effect: 'hearts', icon: 'handHeart', cue: 'The bond that distance cannot loosen',
    opener: 'No matter how far apart we are, ',
    rule: listed('08-28', '08-17', '08-05', '08-23', '08-13'), audience: 'family', featured: true,
  },
  {
    id: 'janmashtami', label: 'Janmashtami', group: 'hindu', look: 'sky', frame: 'just_because',
    effect: 'sparkles', icon: 'moon', cue: 'A midnight celebration of joy',
    opener: 'May the joy of this day stay with you, and ',
    rule: listed('09-04', '08-25', '08-13', '09-01', '08-21'), featured: true,
  },
  {
    id: 'ganesh_chaturthi', label: 'Ganesh Chaturthi', group: 'hindu', look: 'devotion', frame: 'just_because',
    effect: 'sparkles', icon: 'flower', cue: 'New beginnings, with his blessings',
    opener: 'Ganpati Bappa Morya. May he remove every ',
    rule: listed('09-14', '09-04', '08-23', '09-11', '09-01'), featured: true,
  },
  {
    id: 'navratri', label: 'Navratri', group: 'hindu', look: 'colour', frame: 'just_because',
    effect: 'sparkles', icon: 'sparkles', cue: 'Nine nights of devotion and dance',
    opener: 'Over these nine nights, I hope ',
    rule: listed('10-11', '09-30', '09-19', '10-08', '09-28'), featured: true,
  },
  {
    id: 'durga_puja', label: 'Durga Puja', group: 'hindu', look: 'devotion', frame: 'just_because',
    effect: 'sparkles', icon: 'flame', cue: 'Blessings, family and festival lights',
    opener: 'May the blessings of Maa Durga bring you ',
    rule: listed('10-19', '10-07', '09-26', '10-14', '10-04'), featured: true,
  },
  {
    id: 'dussehra', label: 'Dussehra', group: 'hindu', look: 'devotion', frame: 'just_because',
    effect: 'sparkles', icon: 'flame', cue: 'When good wins, again',
    opener: 'May good win in every part of your life, and ',
    rule: listed('10-20', '10-09', '09-27', '10-16', '10-06'), featured: true,
  },
  {
    id: 'karwa_chauth', label: 'Karwa Chauth', group: 'hindu', look: 'romance', frame: 'anniversary',
    effect: 'hearts', icon: 'moon', cue: 'A day of devotion for the one you love',
    opener: 'Every day I am grateful to have you, and ',
    rule: listed('10-29', '10-18', '10-07', '10-26', '10-15'), audience: 'partner', featured: true,
  },
  {
    id: 'diwali', label: 'Diwali', group: 'hindu', look: 'diya', frame: 'just_because',
    effect: 'sparkles', icon: 'flame', cue: 'Light, family and a fresh start',
    opener: 'May the light of Diwali bring you ',
    rule: listed('11-08', '10-29', '10-17', '11-05', '10-26'), featured: true,
  },
  {
    id: 'bhai_dooj', label: 'Bhai Dooj', group: 'hindu', look: 'blush', frame: 'just_because',
    effect: 'hearts', icon: 'handHeart', cue: 'For the sibling who is always there',
    opener: 'Thank you for being the sibling who ',
    rule: listed('11-11', '10-31', '10-19', '11-07', '10-28'), audience: 'family', featured: true,
  },
  {
    id: 'chhath_puja', label: 'Chhath Puja', group: 'hindu', look: 'devotion', frame: 'just_because',
    effect: 'sparkles', icon: 'sun', cue: 'Gratitude to the sun, in quiet devotion',
    opener: 'May the blessings of Chhathi Maiya be with you, and ',
    rule: listed('11-15', '11-04', '10-23', '11-11', '11-01'),
  },
  {
    id: 'guru_purnima', label: 'Guru Purnima', group: 'hindu', look: 'devotion', frame: 'thank_you',
    effect: 'sparkles', icon: 'book', cue: 'Thank the one who showed you the way',
    opener: 'Thank you for guiding me, and for ',
    rule: listed('07-29', '07-18', '07-06', '07-25', '07-15'),
  },

  // New years and harvest
  {
    id: 'lohri', label: 'Lohri', group: 'new_year', look: 'harvest', frame: 'just_because',
    effect: 'sparkles', icon: 'flame', cue: 'Warm fires, sweet things and family',
    opener: 'May the warmth of the bonfire bring you ',
    rule: fixed(1, 13), featured: true,
  },
  {
    id: 'makar_sankranti', label: 'Makar Sankranti', group: 'new_year', look: 'harvest', frame: 'just_because',
    effect: 'sparkles', icon: 'sun', cue: 'Sun, sweets and a new season',
    opener: 'As the sun begins its journey north, I hope ',
    rule: listed('01-14', '01-15', '01-15', '01-14', '01-14'), featured: true,
  },
  {
    id: 'pongal', label: 'Pongal', group: 'new_year', look: 'harvest', frame: 'just_because',
    effect: 'sparkles', icon: 'wheat', cue: 'Thanks for the harvest and the home',
    opener: 'May this harvest bring your home ',
    rule: listed('01-14', '01-15', '01-15', '01-14', '01-14'), featured: true,
  },
  {
    id: 'basant_panchami', label: 'Basant Panchami', group: 'new_year', look: 'spring', frame: 'just_because',
    effect: 'sparkles', icon: 'flower', cue: 'Spring arrives, and so does learning',
    opener: 'As spring arrives, I hope ',
    rule: listed('01-23', '02-11', '01-31', '01-19', '02-07'),
  },
  {
    id: 'ugadi', label: 'Ugadi', group: 'new_year', look: 'spring', frame: 'just_because',
    effect: 'sparkles', icon: 'sprout', cue: 'A new year and a fresh beginning',
    opener: 'May this new year bring you ',
    rule: listed('03-19', '04-07', '03-27', '04-14', '04-03'),
  },
  {
    id: 'gudi_padwa', label: 'Gudi Padwa', group: 'new_year', look: 'spring', frame: 'just_because',
    effect: 'sparkles', icon: 'sunrise', cue: 'A new year, raised high',
    opener: 'May this new year bring you ',
    rule: listed('03-19', '04-07', '03-27', '04-14', '04-03'),
  },
  {
    id: 'vishu', label: 'Vishu', group: 'new_year', look: 'spring', frame: 'just_because',
    effect: 'sparkles', icon: 'sunrise', cue: 'The first sight of a good year',
    opener: 'May the first sight of this year bring you ',
    rule: listed('04-15', '04-15', '04-14', '04-14', '04-15'),
  },
  {
    id: 'puthandu', label: 'Puthandu', group: 'new_year', look: 'spring', frame: 'just_because',
    effect: 'sparkles', icon: 'sunrise', cue: 'The Tamil new year, with family',
    headline: 'Happy Tamil New Year',
    opener: 'May the year ahead bring you ',
    rule: fixed(4, 14),
  },
  {
    id: 'pohela_boishakh', label: 'Pohela Boishakh', group: 'new_year', look: 'harvest', frame: 'just_because',
    effect: 'sparkles', icon: 'sunrise', cue: 'The Bengali new year, with sweets and song',
    headline: 'Happy Bengali New Year',
    opener: 'May the new year bring you ',
    rule: listed('04-15', '04-15', '04-14', '04-15', '04-15'),
  },
  {
    id: 'baisakhi', label: 'Baisakhi', group: 'new_year', look: 'harvest', frame: 'just_because',
    effect: 'sparkles', icon: 'wheat', cue: 'Harvest joy and a new year',
    opener: 'May the harvest of this year bring you ',
    rule: listed('04-14', '04-14', '04-13', '04-14', '04-14'), featured: true,
  },
  {
    id: 'onam', label: 'Onam', group: 'new_year', look: 'harvest', frame: 'just_because',
    effect: 'sparkles', icon: 'flower', cue: 'Flowers, feasts and coming home',
    opener: 'Onam always reminds me of ',
    rule: listed('08-26', '09-12', '09-01', '08-22', '09-09'), featured: true,
  },
  {
    id: 'gujarati_new_year', label: 'Gujarati New Year', group: 'new_year', look: 'diya', frame: 'just_because',
    effect: 'sparkles', icon: 'sparkles', cue: 'A fresh year, with family close',
    headline: 'Saal Mubarak',
    opener: 'Saal Mubarak. May the new year bring you ',
    rule: listed('11-10', '10-30', '10-18', '11-06', '10-27'),
  },

  // National days (India)
  {
    id: 'republic_day', label: 'Republic Day', group: 'national', look: 'tricolour', frame: 'just_because',
    effect: 'confetti', icon: 'flag', cue: 'Pride in the country we share',
    opener: 'Proud of the country we share, and grateful for ',
    rule: fixed(1, 26), featured: true,
  },
  {
    id: 'independence_day', label: 'Independence Day', group: 'national', look: 'tricolour', frame: 'just_because',
    effect: 'confetti', icon: 'flag', cue: 'Gratitude for how far we have come',
    opener: 'Proud of how far we have come, and ',
    rule: fixed(8, 15), featured: true,
  },
  {
    id: 'teachers_day', label: "Teachers' Day", group: 'national', look: 'sky', frame: 'thank_you',
    effect: 'sparkles', icon: 'graduation', cue: 'Thank someone who taught you well',
    opener: 'Thank you for teaching me ',
    rule: fixed(9, 5), featured: true,
  },
  {
    id: 'childrens_day', label: "Children's Day", group: 'national', look: 'colour', frame: 'just_because',
    effect: 'balloons', icon: 'baby', cue: 'For the child in your life',
    opener: 'I hope you never lose ',
    rule: fixed(11, 14), audience: 'family',
  },

  // Eid and Ramadan
  {
    id: 'ramadan', label: 'Ramadan', group: 'muslim', look: 'crescent', frame: 'just_because',
    effect: 'sparkles', icon: 'moon', cue: 'A month of patience, prayer and kindness',
    headline: 'Ramadan Mubarak',
    opener: 'Ramadan Mubarak. May this month bring you ',
    rule: listed('02-18', '02-08', '01-28', '01-16', ['01-05', '12-26']), featured: true,
  },
  {
    id: 'eid_al_fitr', label: 'Eid al-Fitr', group: 'muslim', look: 'crescent', frame: 'just_because',
    effect: 'sparkles', icon: 'moon', cue: 'The joy at the end of the fast',
    headline: 'Eid Mubarak',
    opener: 'Eid Mubarak. May this Eid bring ',
    rule: listed('03-20', '03-09', '02-26', '02-14', '02-04'), featured: true,
  },
  {
    id: 'eid_al_adha', label: 'Eid al-Adha', group: 'muslim', look: 'crescent', frame: 'just_because',
    effect: 'sparkles', icon: 'moon', cue: 'A day of giving, sharing and family',
    headline: 'Eid Mubarak',
    opener: 'Eid Mubarak. May your home be full of ',
    rule: listed('05-27', '05-16', '05-05', '04-24', '04-13'), featured: true,
  },

  // Christian
  {
    id: 'easter', label: 'Easter', group: 'christian', look: 'spring', frame: 'just_because',
    effect: 'sparkles', icon: 'egg', cue: 'A day of hope and gathering',
    opener: 'I hope today brings you rest, and ',
    rule: EASTER,
  },
  {
    id: 'christmas', label: 'Christmas', group: 'christian', look: 'evergreen', frame: 'just_because',
    effect: 'sparkles', icon: 'tree', cue: 'Warmth for the people you miss',
    headline: 'Merry Christmas',
    opener: 'Wherever you are this Christmas, I hope ',
    rule: fixed(12, 25), featured: true,
  },

  // Sikh, Buddhist and Jain
  {
    id: 'guru_nanak_jayanti', label: 'Guru Nanak Jayanti', group: 'dharmic', look: 'devotion', frame: 'just_because',
    effect: 'sparkles', icon: 'sparkles', cue: 'In the spirit of service and equality',
    headline: 'Happy Gurpurab',
    opener: 'May the teachings of Guru Nanak bring you ',
    rule: listed('11-24', '11-14', '11-02', '11-21', '11-10'), featured: true,
  },
  {
    id: 'buddha_purnima', label: 'Buddha Purnima', group: 'dharmic', look: 'spring', frame: 'just_because',
    effect: 'sparkles', icon: 'flower', cue: 'A day for calm and kindness',
    opener: 'May you find stillness today, and ',
    rule: listed('05-01', '05-20', '05-08', '05-27', '05-17'),
  },
  {
    id: 'mahavir_jayanti', label: 'Mahavir Jayanti', group: 'dharmic', look: 'harvest', frame: 'just_because',
    effect: 'sparkles', icon: 'handHeart', cue: 'A day of kindness and non-violence',
    opener: 'May kindness guide you today, and ',
    rule: listed('03-31', '04-18', '04-07', '04-26', '04-16'),
  },

  // Around the world
  {
    id: 'new_year', label: 'New Year', group: 'world', look: 'celebrate', frame: 'just_because',
    effect: 'confetti', icon: 'party', cue: 'A fresh start, shared',
    opener: 'As the year begins, I hope ',
    rule: fixed(1, 1), featured: true,
  },
  {
    id: 'valentines_day', label: "Valentine's Day", group: 'world', look: 'romance', frame: 'anniversary',
    effect: 'hearts', icon: 'heart', cue: 'Say what you usually leave unsaid',
    opener: 'If I had to say it plainly, the thing I love most about us is ',
    rule: fixed(2, 14), audience: 'partner', featured: true,
  },
  {
    id: 'womens_day', label: "Women's Day", group: 'world', look: 'blush', frame: 'thank_you',
    effect: 'sparkles', icon: 'flower', cue: 'For the women who shaped you',
    opener: 'You have shaped so many lives, mine included, by ',
    rule: fixed(3, 8),
  },
  {
    id: 'mothers_day', label: "Mother's Day", group: 'world', look: 'blush', frame: 'thank_you',
    effect: 'hearts', icon: 'heart', cue: 'Gratitude she can revisit',
    opener: 'Thank you for all the times you ',
    rule: nthWeekday(5, 0, 2), audience: 'mom', featured: true,
  },
  {
    id: 'fathers_day', label: "Father's Day", group: 'world', look: 'sage', frame: 'thank_you',
    effect: 'sparkles', icon: 'shield', cue: 'Quiet appreciation counts',
    opener: 'Thank you for the times you ',
    rule: nthWeekday(6, 0, 3), audience: 'dad', featured: true,
  },
  {
    id: 'friendship_day', label: 'Friendship Day', group: 'world', look: 'colour', frame: 'just_because',
    effect: 'confetti', icon: 'users', cue: 'For the one who stayed',
    opener: 'Of everyone I know, you are the one who ',
    rule: nthWeekday(8, 0, 1), audience: 'friend', featured: true,
  },
  {
    id: 'halloween', label: 'Halloween', group: 'world', look: 'night', frame: 'just_because',
    effect: 'celebration', icon: 'ghost', cue: 'A little mischief, shared',
    opener: 'I hope your night is full of ',
    rule: fixed(10, 31), featured: true,
  },
  {
    id: 'thanksgiving', label: 'Thanksgiving', group: 'world', look: 'harvest', frame: 'thank_you',
    effect: 'sparkles', icon: 'wheat', cue: 'Say what you are thankful for',
    opener: 'This year, I am most thankful for ',
    rule: nthWeekday(11, 4, 4),
  },
  {
    id: 'new_years_eve', label: "New Year's Eve", group: 'world', look: 'celebrate', frame: 'just_because',
    effect: 'confetti', icon: 'star', cue: 'One last note before the year ends',
    opener: 'Before this year ends, I want you to know ',
    rule: fixed(12, 31), featured: true,
  },
  {
    id: 'lunar_new_year', label: 'Lunar New Year', group: 'world', look: 'lantern', frame: 'just_because',
    effect: 'confetti', icon: 'lamp', cue: 'Luck, family and a new year',
    opener: 'May the year ahead bring you ',
    rule: listed('02-17', '02-06', '01-26', '02-13', '02-03'),
  },

  // Jewish
  {
    id: 'hanukkah', label: 'Hanukkah', group: 'jewish', look: 'sky', frame: 'just_because',
    effect: 'sparkles', icon: 'star', cue: 'Eight nights of light',
    opener: 'May the lights of Hanukkah bring you ',
    rule: listed('12-05', '12-25', '12-13', '12-02', '12-21'),
  },
  {
    id: 'rosh_hashanah', label: 'Rosh Hashanah', group: 'jewish', look: 'sky', frame: 'just_because',
    effect: 'sparkles', icon: 'bell', cue: 'A sweet new year',
    headline: 'Shana Tova',
    opener: 'Shana Tova. I hope the year ahead is ',
    rule: listed('09-12', '10-02', '09-21', '09-10', '09-28'),
  },
] as const satisfies readonly HolidayDef[];

export type HolidayId = (typeof DEFS)[number]['id'];

export type Holiday = {
  id: HolidayId;
  label: string;
  group: HolidayGroup;
  look: HolidayLook;
  frame: Occasion;
  effect: HolidayEffect;
  icon: HolidayIcon;
  rule: DateRule;
  cue: string;
  /** "Happy Diwali": the line at the top of the card. */
  headline: string;
  /** "Happy Diwali,": the line above the name on the recipient's page. */
  greeting: string;
  /** Three lines to start the message with: this festival's own, then two that fit any. */
  starters: readonly [string, string, string];
  audience: Audience | null;
  featured: boolean;
};

function toHoliday(def: HolidayDef & { id: HolidayId }): Holiday {
  const headline = def.headline ?? `Happy ${def.label}`;
  return {
    id: def.id,
    label: def.label,
    group: def.group,
    look: def.look,
    frame: def.frame,
    effect: def.effect,
    icon: def.icon,
    rule: def.rule,
    cue: def.cue,
    headline,
    greeting: `${headline},`,
    starters: [
      def.opener,
      `Thinking of you this ${def.label}, and `,
      `I hope this ${def.label} brings you `,
    ],
    audience: def.audience ?? null,
    featured: def.featured === true,
  };
}

export const HOLIDAYS: readonly Holiday[] = DEFS.map((def) => toHoliday(def as HolidayDef & { id: HolidayId }));

const BY_ID: ReadonlyMap<string, Holiday> = new Map(HOLIDAYS.map((holiday) => [holiday.id, holiday]));

export function isHolidayId(value: unknown): value is HolidayId {
  return typeof value === 'string' && BY_ID.has(value);
}

/** The festival for a stored or received card type, or null when it is not one. */
export function holidayById(id: string | null | undefined): Holiday | null {
  return id ? (BY_ID.get(id) ?? null) : null;
}

/* ----------------------------------------------------------------- when */

export type HolidayOccurrence = {
  holiday: Holiday;
  date: CalendarDay;
  /** 0 is today, 1 tomorrow, -1 yesterday. */
  daysUntil: number;
};

/**
 * The next time this festival is kept, counting `graceDays` back so a wish for yesterday's festival
 * can still be made. Null when its day is not known (a moon festival past the listed years).
 */
export function nextOccurrence(holiday: Holiday, now: Date, graceDays = 0): HolidayOccurrence | null {
  const today = calendarDayOf(now);
  let best: HolidayOccurrence | null = null;
  for (let year = today.year; year <= today.year + 2; year += 1) {
    for (const date of datesIn(holiday.rule, year)) {
      const daysUntil = daysBetween(today, date);
      if (daysUntil < -graceDays) continue;
      if (!best || daysUntil < best.daysUntil) best = { holiday, date, daysUntil };
    }
  }
  return best;
}

export type UpcomingOptions = {
  /** Look this many days ahead. */
  withinDays: number;
  max?: number;
  /** Only the festivals worth suggesting on Home. */
  featuredOnly?: boolean;
  /** Include a festival that was this many days ago. */
  graceDays?: number;
};

/** Festivals in the next stretch of days, soonest first. */
export function upcomingHolidays(now: Date, options: UpcomingOptions): HolidayOccurrence[] {
  const graceDays = options.graceDays ?? 0;
  const found: HolidayOccurrence[] = [];
  for (const holiday of HOLIDAYS) {
    if (options.featuredOnly && !holiday.featured) continue;
    const next = nextOccurrence(holiday, now, graceDays);
    if (next && next.daysUntil <= options.withinDays) found.push(next);
  }
  found.sort((a, b) => a.daysUntil - b.daysUntil || a.holiday.label.localeCompare(b.holiday.label));
  return options.max === undefined ? found : found.slice(0, options.max);
}

/** How far ahead "coming up" looks, in days. */
export const COMING_UP_DAYS = 60;

/**
 * The festivals put in front of people at the top of Home and of the "What's the moment?" step, so
 * nobody has to search the list: the widely celebrated ones in the next two months, soonest first.
 * A festival from yesterday stays, so a late wish is still one tap away.
 */
export function comingUpHolidays(now: Date, max = 6): HolidayOccurrence[] {
  return upcomingHolidays(now, { withinDays: COMING_UP_DAYS, featuredOnly: true, graceDays: 1, max });
}

export type HolidaySection = {
  group: HolidayGroup;
  title: string;
  items: Array<{ holiday: Holiday; next: HolidayOccurrence | null }>;
};

/** Every festival, grouped, each group soonest first; a festival with no known day goes last. */
export function holidaySections(now: Date): HolidaySection[] {
  return HOLIDAY_GROUPS.map(({ id, title }) => {
    const items = HOLIDAYS.filter((holiday) => holiday.group === id)
      .map((holiday) => ({ holiday, next: nextOccurrence(holiday, now, 1) }))
      .sort((a, b) => {
        if (a.next && b.next) return a.next.daysUntil - b.next.daysUntil;
        if (a.next) return -1;
        if (b.next) return 1;
        return a.holiday.label.localeCompare(b.holiday.label);
      });
    return { group: id, title, items };
  }).filter((section) => section.items.length > 0);
}

/* ---------------------------------------------------------------- words */

/** "Today", "Tomorrow", "In 12 days", "Yesterday". */
export function countdownLabel(daysUntil: number): string {
  if (daysUntil === 0) return 'Today';
  if (daysUntil === 1) return 'Tomorrow';
  if (daysUntil === -1) return 'Yesterday';
  if (daysUntil < 0) return `${-daysUntil} days ago`;
  return `In ${daysUntil} days`;
}

/** "Fri 20 Nov", with the year when it is not this one. */
export function holidayDateLabel(day: CalendarDay, now: Date): string {
  return formatCalendarDay(day, now.getFullYear());
}
