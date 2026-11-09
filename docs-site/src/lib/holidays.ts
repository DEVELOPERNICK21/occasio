/**
 * Every festival and holiday a card can be made for, as the recipient's page knows it: its name,
 * the greeting at the top of the card, its colours and how its story looks.
 *
 * This is the web twin of `src/features/create/domain/holidays.ts` and the colour families in
 * `templateTheme.ts`. The recipient page cannot import from the app, so the table is copied, and
 * `__tests__/create/holidayParity.test.ts` fails when the two drift. Generated from the app's list;
 * when a festival is added there, add it here (the test names what is missing).
 */

export type HolidayLook =
  | 'devotion'
  | 'colour'
  | 'blush'
  | 'sky'
  | 'romance'
  | 'diya'
  | 'harvest'
  | 'spring'
  | 'tricolour'
  | 'crescent'
  | 'evergreen'
  | 'celebrate'
  | 'sage'
  | 'night'
  | 'lantern';

export type HolidayEffect = 'balloons' | 'hearts' | 'confetti' | 'sparkles' | 'celebration';

export type LookPalette = {
  accent: string;
  accentSecondary: string;
  softBackground: string;
  orbPrimary: string;
  orbSecondary: string;
  /** How the interactive story looks for this family. */
  fx: 'confetti' | 'petals' | 'fireworks' | 'lanterns' | 'stars';
  backdrop: 'party' | 'romance' | 'garden' | 'celebration' | 'doodle';
  costume: 'party_hat' | 'rose' | 'flower_crown' | 'medal' | 'shades';
  pattern: 'dots' | 'hearts' | 'leaves' | 'stars' | 'doodles';
};

export const HOLIDAY_LOOKS: Record<HolidayLook, LookPalette> = {
  devotion: { accent: '#BF5518', accentSecondary: '#E1A62E', softBackground: '#FBEDDD', orbPrimary: '#F0B087', orbSecondary: '#E6C268', fx: 'lanterns', backdrop: 'celebration', costume: 'flower_crown', pattern: 'dots' },
  colour: { accent: '#D63A73', accentSecondary: '#F4A100', softBackground: '#FDEAF2', orbPrimary: '#F6B9D0', orbSecondary: '#FFD36B', fx: 'confetti', backdrop: 'party', costume: 'party_hat', pattern: 'dots' },
  blush: { accent: '#E07A8A', accentSecondary: '#F7C9B6', softBackground: '#FCEEF2', orbPrimary: '#F7C9B6', orbSecondary: '#F6A94A', fx: 'petals', backdrop: 'romance', costume: 'flower_crown', pattern: 'hearts' },
  sky: { accent: '#2F6FA3', accentSecondary: '#8DBBDD', softBackground: '#EBF3FA', orbPrimary: '#BAD6EC', orbSecondary: '#E8D8A0', fx: 'stars', backdrop: 'doodle', costume: 'party_hat', pattern: 'stars' },
  romance: { accent: '#D44D6A', accentSecondary: '#F5B8C8', softBackground: '#FCE8EE', orbPrimary: '#F5B8C8', orbSecondary: '#E8615D', fx: 'petals', backdrop: 'romance', costume: 'rose', pattern: 'hearts' },
  diya: { accent: '#C9741A', accentSecondary: '#F2B33D', softBackground: '#FDF0DA', orbPrimary: '#F6D28D', orbSecondary: '#E8A13A', fx: 'lanterns', backdrop: 'celebration', costume: 'party_hat', pattern: 'dots' },
  harvest: { accent: '#B9831A', accentSecondary: '#7C9D3F', softBackground: '#FBF2DA', orbPrimary: '#EFD488', orbSecondary: '#B9D08B', fx: 'petals', backdrop: 'garden', costume: 'flower_crown', pattern: 'leaves' },
  spring: { accent: '#B8921A', accentSecondary: '#86AE6D', softBackground: '#FAF5D8', orbPrimary: '#EFDF86', orbSecondary: '#CBE2B5', fx: 'petals', backdrop: 'garden', costume: 'flower_crown', pattern: 'leaves' },
  tricolour: { accent: '#D9701C', accentSecondary: '#2E7D4F', softBackground: '#FFF2E2', orbPrimary: '#F5C48D', orbSecondary: '#A3D1B4', fx: 'fireworks', backdrop: 'celebration', costume: 'medal', pattern: 'stars' },
  crescent: { accent: '#1F7A6B', accentSecondary: '#C9A54B', softBackground: '#E8F4F1', orbPrimary: '#A8D5CB', orbSecondary: '#E9D9A6', fx: 'lanterns', backdrop: 'celebration', costume: 'party_hat', pattern: 'stars' },
  evergreen: { accent: '#B23A36', accentSecondary: '#2F6B4F', softBackground: '#FBEEEB', orbPrimary: '#E8A9A5', orbSecondary: '#9CC7AF', fx: 'stars', backdrop: 'celebration', costume: 'party_hat', pattern: 'stars' },
  celebrate: { accent: '#34439A', accentSecondary: '#D4AE47', softBackground: '#EDEFFA', orbPrimary: '#B7C0EC', orbSecondary: '#EAD08A', fx: 'fireworks', backdrop: 'celebration', costume: 'party_hat', pattern: 'stars' },
  sage: { accent: '#5B7A6E', accentSecondary: '#A8C4B8', softBackground: '#EEF4F1', orbPrimary: '#A8C4B8', orbSecondary: '#857371', fx: 'stars', backdrop: 'garden', costume: 'shades', pattern: 'leaves' },
  night: { accent: '#CF5E17', accentSecondary: '#4B4540', softBackground: '#FBEFE4', orbPrimary: '#F4B07A', orbSecondary: '#9A948C', fx: 'stars', backdrop: 'doodle', costume: 'shades', pattern: 'doodles' },
  lantern: { accent: '#BC3B2B', accentSecondary: '#DFB03F', softBackground: '#FCEDE6', orbPrimary: '#EEA89C', orbSecondary: '#EAD08A', fx: 'lanterns', backdrop: 'celebration', costume: 'party_hat', pattern: 'dots' },
};

export type WebHoliday = {
  label: string;
  /** "Happy Diwali": the headline. The greeting above the name is this with a comma. */
  headline: string;
  look: HolidayLook;
  effect: HolidayEffect;
  /** The stand-in everyday moment, for the pieces that only know the five. */
  frame: 'birthday' | 'anniversary' | 'thank_you' | 'congratulations' | 'just_because';
};

export const WEB_HOLIDAYS: Record<string, WebHoliday> = {
  maha_shivratri: { label: 'Maha Shivratri', headline: 'Happy Maha Shivratri', look: 'devotion', effect: 'sparkles', frame: 'just_because' },
  holi: { label: 'Holi', headline: 'Happy Holi', look: 'colour', effect: 'confetti', frame: 'just_because' },
  ram_navami: { label: 'Ram Navami', headline: 'Happy Ram Navami', look: 'devotion', effect: 'sparkles', frame: 'just_because' },
  hanuman_jayanti: { label: 'Hanuman Jayanti', headline: 'Happy Hanuman Jayanti', look: 'devotion', effect: 'sparkles', frame: 'just_because' },
  raksha_bandhan: { label: 'Raksha Bandhan', headline: 'Happy Raksha Bandhan', look: 'blush', effect: 'hearts', frame: 'just_because' },
  janmashtami: { label: 'Janmashtami', headline: 'Happy Janmashtami', look: 'sky', effect: 'sparkles', frame: 'just_because' },
  ganesh_chaturthi: { label: 'Ganesh Chaturthi', headline: 'Happy Ganesh Chaturthi', look: 'devotion', effect: 'sparkles', frame: 'just_because' },
  navratri: { label: 'Navratri', headline: 'Happy Navratri', look: 'colour', effect: 'sparkles', frame: 'just_because' },
  durga_puja: { label: 'Durga Puja', headline: 'Happy Durga Puja', look: 'devotion', effect: 'sparkles', frame: 'just_because' },
  dussehra: { label: 'Dussehra', headline: 'Happy Dussehra', look: 'devotion', effect: 'sparkles', frame: 'just_because' },
  karwa_chauth: { label: 'Karwa Chauth', headline: 'Happy Karwa Chauth', look: 'romance', effect: 'hearts', frame: 'anniversary' },
  diwali: { label: 'Diwali', headline: 'Happy Diwali', look: 'diya', effect: 'sparkles', frame: 'just_because' },
  bhai_dooj: { label: 'Bhai Dooj', headline: 'Happy Bhai Dooj', look: 'blush', effect: 'hearts', frame: 'just_because' },
  chhath_puja: { label: 'Chhath Puja', headline: 'Happy Chhath Puja', look: 'devotion', effect: 'sparkles', frame: 'just_because' },
  guru_purnima: { label: 'Guru Purnima', headline: 'Happy Guru Purnima', look: 'devotion', effect: 'sparkles', frame: 'thank_you' },
  lohri: { label: 'Lohri', headline: 'Happy Lohri', look: 'harvest', effect: 'sparkles', frame: 'just_because' },
  makar_sankranti: { label: 'Makar Sankranti', headline: 'Happy Makar Sankranti', look: 'harvest', effect: 'sparkles', frame: 'just_because' },
  pongal: { label: 'Pongal', headline: 'Happy Pongal', look: 'harvest', effect: 'sparkles', frame: 'just_because' },
  basant_panchami: { label: 'Basant Panchami', headline: 'Happy Basant Panchami', look: 'spring', effect: 'sparkles', frame: 'just_because' },
  ugadi: { label: 'Ugadi', headline: 'Happy Ugadi', look: 'spring', effect: 'sparkles', frame: 'just_because' },
  gudi_padwa: { label: 'Gudi Padwa', headline: 'Happy Gudi Padwa', look: 'spring', effect: 'sparkles', frame: 'just_because' },
  vishu: { label: 'Vishu', headline: 'Happy Vishu', look: 'spring', effect: 'sparkles', frame: 'just_because' },
  puthandu: { label: 'Puthandu', headline: 'Happy Tamil New Year', look: 'spring', effect: 'sparkles', frame: 'just_because' },
  pohela_boishakh: { label: 'Pohela Boishakh', headline: 'Happy Bengali New Year', look: 'harvest', effect: 'sparkles', frame: 'just_because' },
  baisakhi: { label: 'Baisakhi', headline: 'Happy Baisakhi', look: 'harvest', effect: 'sparkles', frame: 'just_because' },
  onam: { label: 'Onam', headline: 'Happy Onam', look: 'harvest', effect: 'sparkles', frame: 'just_because' },
  gujarati_new_year: { label: 'Gujarati New Year', headline: 'Saal Mubarak', look: 'diya', effect: 'sparkles', frame: 'just_because' },
  republic_day: { label: 'Republic Day', headline: 'Happy Republic Day', look: 'tricolour', effect: 'confetti', frame: 'just_because' },
  independence_day: { label: 'Independence Day', headline: 'Happy Independence Day', look: 'tricolour', effect: 'confetti', frame: 'just_because' },
  teachers_day: { label: "Teachers' Day", headline: "Happy Teachers' Day", look: 'sky', effect: 'sparkles', frame: 'thank_you' },
  childrens_day: { label: "Children's Day", headline: "Happy Children's Day", look: 'colour', effect: 'balloons', frame: 'just_because' },
  ramadan: { label: 'Ramadan', headline: 'Ramadan Mubarak', look: 'crescent', effect: 'sparkles', frame: 'just_because' },
  eid_al_fitr: { label: 'Eid al-Fitr', headline: 'Eid Mubarak', look: 'crescent', effect: 'sparkles', frame: 'just_because' },
  eid_al_adha: { label: 'Eid al-Adha', headline: 'Eid Mubarak', look: 'crescent', effect: 'sparkles', frame: 'just_because' },
  easter: { label: 'Easter', headline: 'Happy Easter', look: 'spring', effect: 'sparkles', frame: 'just_because' },
  christmas: { label: 'Christmas', headline: 'Merry Christmas', look: 'evergreen', effect: 'sparkles', frame: 'just_because' },
  guru_nanak_jayanti: { label: 'Guru Nanak Jayanti', headline: 'Happy Gurpurab', look: 'devotion', effect: 'sparkles', frame: 'just_because' },
  buddha_purnima: { label: 'Buddha Purnima', headline: 'Happy Buddha Purnima', look: 'spring', effect: 'sparkles', frame: 'just_because' },
  mahavir_jayanti: { label: 'Mahavir Jayanti', headline: 'Happy Mahavir Jayanti', look: 'harvest', effect: 'sparkles', frame: 'just_because' },
  new_year: { label: 'New Year', headline: 'Happy New Year', look: 'celebrate', effect: 'confetti', frame: 'just_because' },
  valentines_day: { label: "Valentine's Day", headline: "Happy Valentine's Day", look: 'romance', effect: 'hearts', frame: 'anniversary' },
  womens_day: { label: "Women's Day", headline: "Happy Women's Day", look: 'blush', effect: 'sparkles', frame: 'thank_you' },
  mothers_day: { label: "Mother's Day", headline: "Happy Mother's Day", look: 'blush', effect: 'hearts', frame: 'thank_you' },
  fathers_day: { label: "Father's Day", headline: "Happy Father's Day", look: 'sage', effect: 'sparkles', frame: 'thank_you' },
  friendship_day: { label: 'Friendship Day', headline: 'Happy Friendship Day', look: 'colour', effect: 'confetti', frame: 'just_because' },
  halloween: { label: 'Halloween', headline: 'Happy Halloween', look: 'night', effect: 'celebration', frame: 'just_because' },
  thanksgiving: { label: 'Thanksgiving', headline: 'Happy Thanksgiving', look: 'harvest', effect: 'sparkles', frame: 'thank_you' },
  new_years_eve: { label: "New Year's Eve", headline: "Happy New Year's Eve", look: 'celebrate', effect: 'confetti', frame: 'just_because' },
  lunar_new_year: { label: 'Lunar New Year', headline: 'Happy Lunar New Year', look: 'lantern', effect: 'confetti', frame: 'just_because' },
  hanukkah: { label: 'Hanukkah', headline: 'Happy Hanukkah', look: 'sky', effect: 'sparkles', frame: 'just_because' },
  rosh_hashanah: { label: 'Rosh Hashanah', headline: 'Shana Tova', look: 'sky', effect: 'sparkles', frame: 'just_because' },
};

export function webHolidayFor(templateType: string): WebHoliday | null {
  return Object.prototype.hasOwnProperty.call(WEB_HOLIDAYS, templateType) ? WEB_HOLIDAYS[templateType]! : null;
}
