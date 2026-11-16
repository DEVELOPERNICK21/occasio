import {
  EASTER,
  LISTED_FIRST_YEAR,
  LISTED_LAST_YEAR,
  datesIn,
  easterSunday,
  fixed,
  listed,
  nthWeekdayOfMonth,
} from '../../src/features/create/domain/holidayDates';
import {
  HOLIDAYS,
  HOLIDAY_GROUPS,
  COMING_UP_DAYS,
  comingUpHolidays,
  countdownLabel,
  holidayById,
  holidaySections,
  isHolidayId,
  nextOccurrence,
  upcomingHolidays,
} from '../../src/features/create/domain/holidays';
import { effectForMoment } from '../../src/features/create/domain/occasionEffects';
import { isInteractiveExperience } from '../../src/features/create/domain/experienceMode';
import { messageStarters } from '../../src/features/create/domain/messageStarters';
import {
  defaultTemplateIdForType,
  momentHeadline,
} from '../../src/features/create/domain/audienceOccasion';
import { getTemplateTheme, holidayTheme } from '../../src/features/create/domain/templateTheme';
import {
  parseTemplateType,
  templateLabel,
  wishGreeting,
} from '../../src/features/create/domain/templates';

const id = (name: string) => {
  const holiday = holidayById(name);
  if (!holiday) throw new Error(`no festival ${name}`);
  return holiday;
};
const on = (year: number, month: number, day: number) => new Date(year, month - 1, day, 9, 30);
const when = (name: string, now: Date, grace = 0) => {
  const next = nextOccurrence(id(name), now, grace);
  return next ? `${next.date.year}-${String(next.date.month).padStart(2, '0')}-${String(next.date.day).padStart(2, '0')}` : null;
};

describe('the dates a rule gives', () => {
  it('works out Western Easter', () => {
    expect([2026, 2027, 2028, 2029, 2030].map((y) => easterSunday(y))).toEqual([
      { year: 2026, month: 4, day: 5 },
      { year: 2027, month: 3, day: 28 },
      { year: 2028, month: 4, day: 16 },
      { year: 2029, month: 4, day: 1 },
      { year: 2030, month: 4, day: 21 },
    ]);
    expect(datesIn(EASTER, 2031)).toEqual([{ year: 2031, month: 4, day: 13 }]);
  });

  it('finds the nth weekday of a month', () => {
    // Mother's Day: 2nd Sunday of May. Father's Day: 3rd Sunday of June. Thanksgiving: 4th Thursday of November.
    expect(nthWeekdayOfMonth(2026, 5, 0, 2)).toEqual({ year: 2026, month: 5, day: 10 });
    expect(nthWeekdayOfMonth(2027, 5, 0, 2)).toEqual({ year: 2027, month: 5, day: 9 });
    expect(nthWeekdayOfMonth(2026, 6, 0, 3)).toEqual({ year: 2026, month: 6, day: 21 });
    expect(nthWeekdayOfMonth(2026, 11, 4, 4)).toEqual({ year: 2026, month: 11, day: 26 });
    expect(nthWeekdayOfMonth(2026, 8, 0, 1)).toEqual({ year: 2026, month: 8, day: 2 });
  });

  it('gives a listed festival nothing outside the listed years, and two days when a year has two', () => {
    const rule = listed('01-05', '01-06', '01-07', '01-08', ['01-09', '12-26']);
    expect(datesIn(rule, 2030)).toEqual([
      { year: 2030, month: 1, day: 9 },
      { year: 2030, month: 12, day: 26 },
    ]);
    expect(datesIn(rule, 2031)).toEqual([]);
    expect(datesIn(fixed(12, 25), 2040)).toEqual([{ year: 2040, month: 12, day: 25 }]);
  });
});

describe('the list', () => {
  it('has every festival once, with a real group, a greeting and three openers', () => {
    const ids = HOLIDAYS.map((h) => h.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(HOLIDAYS.length).toBeGreaterThanOrEqual(45);
    const groups = new Set(HOLIDAY_GROUPS.map((g) => g.id));
    for (const holiday of HOLIDAYS) {
      expect(groups.has(holiday.group)).toBe(true);
      expect(holiday.greeting).toBe(`${holiday.headline},`);
      expect(holiday.starters).toHaveLength(3);
      // The opener must end mid-sentence, with room to carry on.
      for (const starter of holiday.starters) expect(starter.endsWith(' ')).toBe(true);
    }
  });

  it('names the festivals people asked for', () => {
    for (const name of ['halloween', 'diwali', 'new_year', 'christmas', 'holi', 'eid_al_fitr', 'raksha_bandhan', 'valentines_day']) {
      expect(isHolidayId(name)).toBe(true);
    }
    expect(isHolidayId('birthday')).toBe(false);
    expect(isHolidayId(null)).toBe(false);
  });

  it('keeps the voice calm: no exclamation marks, no emoji, in anything a person reads', () => {
    for (const holiday of HOLIDAYS) {
      const text = [holiday.label, holiday.headline, holiday.cue, ...holiday.starters].join(' ');
      expect(text).not.toContain('!');
      expect(text).not.toMatch(/\p{Extended_Pictographic}/u);
    }
  });

  it('writes the greeting each festival is known by', () => {
    expect(id('diwali').headline).toBe('Happy Diwali');
    expect(id('christmas').headline).toBe('Merry Christmas');
    expect(id('eid_al_fitr').headline).toBe('Eid Mubarak');
    expect(id('eid_al_adha').headline).toBe('Eid Mubarak');
    expect(id('rosh_hashanah').headline).toBe('Shana Tova');
    expect(id('guru_nanak_jayanti').headline).toBe('Happy Gurpurab');
    expect(id('halloween').greeting).toBe('Happy Halloween,');
  });

  it('puts a festival’s own opener first, then two that suit any', () => {
    expect(id('diwali').starters).toEqual([
      'May the light of Diwali bring you ',
      'Thinking of you this Diwali, and ',
      'I hope this Diwali brings you ',
    ]);
  });

  it('covers the current and next year for every festival that follows the moon', () => {
    // When this fails the calendar has run out: extend the lists in holidays.ts and holidayDates.ts.
    const year = new Date().getFullYear();
    expect(LISTED_FIRST_YEAR).toBeLessThanOrEqual(year);
    expect(LISTED_LAST_YEAR).toBeGreaterThanOrEqual(year + 1);
    for (const holiday of HOLIDAYS.filter((h) => h.rule.kind === 'listed')) {
      for (let y = LISTED_FIRST_YEAR; y <= LISTED_LAST_YEAR; y += 1) {
        expect(datesIn(holiday.rule, y).length).toBeGreaterThan(0);
      }
    }
  });
});

describe('when a festival is', () => {
  it('finds the next Diwali, and the one after once it has passed', () => {
    expect(when('diwali', on(2026, 11, 1))).toBe('2026-11-08');
    expect(when('diwali', on(2026, 11, 9))).toBe('2027-10-29');
    // The day after still counts when a grace of one day is asked for.
    expect(when('diwali', on(2026, 11, 9), 1)).toBe('2026-11-08');
  });

  it('rolls fixed festivals over the new year', () => {
    expect(when('new_year', on(2026, 12, 31))).toBe('2027-01-01');
    expect(when('christmas', on(2026, 12, 26))).toBe('2027-12-25');
  });

  it('knows the festivals the way people keep them', () => {
    const now = on(2026, 1, 2);
    expect(when('holi', now)).toBe('2026-03-04');
    expect(when('mothers_day', now)).toBe('2026-05-10');
    expect(when('easter', now)).toBe('2026-04-05');
    expect(when('halloween', now)).toBe('2026-10-31');
    expect(when('republic_day', now)).toBe('2026-01-26');
    expect(when('ramadan', now)).toBe('2026-02-18');
    expect(when('eid_al_fitr', now)).toBe('2026-03-20');
  });

  it('picks the right one of two Ramadans in 2030', () => {
    expect(when('ramadan', on(2030, 1, 10))).toBe('2030-12-26');
    expect(when('ramadan', on(2030, 1, 1))).toBe('2030-01-05');
  });

  it('has no day for a moon festival past the listed years, instead of guessing', () => {
    expect(when('diwali', on(2031, 1, 1))).toBeNull();
    expect(when('christmas', on(2031, 1, 1))).toBe('2031-12-25');
  });

  it('is not thrown by the clocks changing: a day is a day', () => {
    // Clocks go forward in the US on 8 Mar 2026 and back on 1 Nov 2026.
    expect(nextOccurrence(id('holi'), on(2026, 3, 3))?.daysUntil).toBe(1);
    expect(nextOccurrence(id('diwali'), on(2026, 11, 7))?.daysUntil).toBe(1);
  });
});

describe('what is coming up', () => {
  const now = on(2026, 11, 9);

  it('lists festivals in order, soonest first, with the count of days', () => {
    const soon = upcomingHolidays(now, { withinDays: 30 });
    const labels = soon.map((o) => o.holiday.id);
    expect(labels.slice(0, 4)).toEqual(['gujarati_new_year', 'bhai_dooj', 'childrens_day', 'chhath_puja']);
    expect(soon.map((o) => o.daysUntil)).toEqual([...soon.map((o) => o.daysUntil)].sort((a, b) => a - b));
    expect(soon.every((o) => o.daysUntil <= 30)).toBe(true);
  });

  it('puts the well-known festivals of the next two months at the top, soonest first', () => {
    const top = comingUpHolidays(now);
    // Diwali was yesterday and stays for a late wish; Thanksgiving and Chhath Puja are on the list but not suggested.
    expect(top.map((o) => o.holiday.id)).toEqual([
      'diwali',
      'bhai_dooj',
      'guru_nanak_jayanti',
      'christmas',
      'new_years_eve',
      'new_year',
    ]);
    expect(top.map((o) => o.daysUntil)).toEqual([-1, 2, 15, 46, 52, 53]);
    expect(top.every((o) => o.daysUntil <= COMING_UP_DAYS)).toBe(true);
  });

  it('moves on with the days, and can be capped', () => {
    expect(comingUpHolidays(on(2026, 11, 10))[0]?.holiday.id).toBe('bhai_dooj');
    expect(comingUpHolidays(now, 2).map((o) => o.holiday.id)).toEqual(['diwali', 'bhai_dooj']);
  });

  it('suggests nothing it cannot date: past the listed years only festivals worked out by rule remain', () => {
    const top = comingUpHolidays(on(2031, 4, 20));
    expect(top.map((o) => o.holiday.id)).toContain('mothers_day');
    expect(top.some((o) => o.holiday.rule.kind === 'listed')).toBe(false);
    // With nothing dated and well known close by, the list is empty and the screen shows only the link.
    expect(comingUpHolidays(on(2031, 3, 1))).toEqual([]);
  });

  it('keeps a festival from yesterday for a late wish', () => {
    const day = on(2026, 11, 9);
    expect(upcomingHolidays(day, { withinDays: 0, graceDays: 1 }).map((o) => o.holiday.id)).toContain('diwali');
    expect(upcomingHolidays(day, { withinDays: 0 }).map((o) => o.holiday.id)).not.toContain('diwali');
  });

  it('groups every festival once, soonest first inside each group', () => {
    const sections = holidaySections(now);
    expect(sections.flatMap((s) => s.items).length).toBe(HOLIDAYS.length);
    for (const section of sections) {
      const days = section.items.map((i) => i.next?.daysUntil ?? Number.POSITIVE_INFINITY);
      expect(days).toEqual([...days].sort((a, b) => a - b));
    }
  });
});

describe('the words', () => {
  it('says how far off a festival is', () => {
    expect(countdownLabel(0)).toBe('Today');
    expect(countdownLabel(1)).toBe('Tomorrow');
    expect(countdownLabel(-1)).toBe('Yesterday');
    expect(countdownLabel(12)).toBe('In 12 days');
  });
});

describe('a festival as a card type', () => {
  it('is a card type the app can store and read back, and old ones still are', () => {
    expect(parseTemplateType('diwali')).toBe('diwali');
    expect(parseTemplateType('mothers_day')).toBe('mothers_day');
    expect(parseTemplateType('sorry')).toBe('sorry');
    expect(parseTemplateType('not_a_festival')).toBeNull();
  });

  it('has a label, a greeting and a headline', () => {
    expect(templateLabel('diwali')).toBe('Diwali');
    expect(templateLabel('mothers_day')).toBe("Mother's Day");
    expect(wishGreeting('holi')).toBe('Happy Holi,');
    expect(wishGreeting('eid_al_fitr')).toBe('Eid Mubarak,');
    expect(momentHeadline('diwali', 'just_because')).toBe('Happy Diwali');
    // An everyday card keeps its occasion's headline.
    expect(momentHeadline('birthday', 'birthday')).toBe('Happy Birthday');
    expect(momentHeadline(null, 'thank_you')).toBe('Thank you');
  });

  it('has its own colours, effect and openers', () => {
    expect(getTemplateTheme('diwali').label).toBe('Diwali');
    expect(getTemplateTheme('diwali').accent).not.toBe(getTemplateTheme('holi').accent);
    expect(holidayTheme('diwali')?.kicker).toBe('A Diwali wish');
    expect(holidayTheme('birthday')).toBeNull();
    expect(effectForMoment('just_because', 'valentines_day')).toBe('hearts');
    expect(effectForMoment('just_because', 'diwali')).toBe('sparkles');
    expect(effectForMoment('just_because', 'just_because')).toBe('celebration');
    expect(messageStarters('just_because', 'diwali')[0]).toBe('May the light of Diwali bring you ');
    expect(messageStarters('birthday')[0]).toContain('birthday');
  });

  it('opens as a story like every other moment, with the full-photo frame to start', () => {
    expect(isInteractiveExperience('diwali')).toBe(true);
    expect(isInteractiveExperience('sorry')).toBe(false);
    expect(defaultTemplateIdForType('halloween')).toBe('B10');
  });
});
