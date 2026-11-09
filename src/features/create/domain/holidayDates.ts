/**
 * When a festival or holiday falls. Three kinds can be worked out, and one cannot:
 *
 *  - `fixed`        the same day every year (Christmas, Independence Day).
 *  - `nthWeekday`   the 2nd Sunday of May (Mother's Day), the 4th Thursday of November.
 *  - `easter`       Western Easter, from the Gregorian computus.
 *  - `listed`       festivals that follow the moon (Diwali, Holi, Eid). No formula gives the day
 *                   people actually keep, so these are written down, one list per festival.
 *
 * The listed days are for 2026 to 2030, in that order. They are the India calendar days from the
 * open-source `holidays` data (vacanza/holidays, MIT), checked against other published calendars.
 * A moon festival can fall a day apart depending on where someone lives, so the app says so.
 * Past `LISTED_LAST_YEAR` a moon festival has no day, and the app simply stops counting down to it
 * until this file is extended; the card itself still works.
 */

/** A calendar day with no time or zone. `month` is 1 to 12. */
export type CalendarDay = { year: number; month: number; day: number };

export type DateRule =
  | { readonly kind: 'fixed'; readonly month: number; readonly day: number }
  | { readonly kind: 'nthWeekday'; readonly month: number; readonly weekday: number; readonly nth: number }
  | { readonly kind: 'easter' }
  | { readonly kind: 'listed'; readonly dates: Readonly<Record<number, string | readonly string[]>> };

export const LISTED_FIRST_YEAR = 2026;
export const LISTED_LAST_YEAR = 2030;

type Listed = string | readonly string[];

/** Days for 2026, 2027, 2028, 2029 and 2030, each as "MM-DD". A year with two days gets a list. */
export function listed(y2026: Listed, y2027: Listed, y2028: Listed, y2029: Listed, y2030: Listed): DateRule {
  return {
    kind: 'listed',
    dates: { 2026: y2026, 2027: y2027, 2028: y2028, 2029: y2029, 2030: y2030 },
  };
}

export const fixed = (month: number, day: number): DateRule => ({ kind: 'fixed', month, day });

export const nthWeekday = (month: number, weekday: number, nth: number): DateRule => ({
  kind: 'nthWeekday',
  month,
  weekday,
  nth,
});

export const EASTER: DateRule = { kind: 'easter' };

/** Western Easter Sunday (the "anonymous Gregorian" computus). */
export function easterSunday(year: number): CalendarDay {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return { year, month, day };
}

/** The nth (1 = first) given weekday (0 = Sunday) of a month. */
export function nthWeekdayOfMonth(year: number, month: number, weekday: number, nth: number): CalendarDay {
  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const day = 1 + ((weekday - firstWeekday + 7) % 7) + (nth - 1) * 7;
  return { year, month, day };
}

function parseListed(year: number, value: string): CalendarDay | null {
  const match = /^(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  return { year, month: Number(match[1]), day: Number(match[2]) };
}

/** The days a rule gives in one calendar year: usually one, none if a moon festival is not listed. */
export function datesIn(rule: DateRule, year: number): CalendarDay[] {
  switch (rule.kind) {
    case 'fixed':
      return [{ year, month: rule.month, day: rule.day }];
    case 'nthWeekday':
      return [nthWeekdayOfMonth(year, rule.month, rule.weekday, rule.nth)];
    case 'easter':
      return [easterSunday(year)];
    case 'listed': {
      const entry = rule.dates[year];
      if (entry === undefined) return [];
      const values = typeof entry === 'string' ? [entry] : entry;
      return values.flatMap((value) => parseListed(year, value) ?? []);
    }
  }
}

/** Whole days since 1970-01-01 for a calendar day, so two days can be subtracted without time zones. */
export function dayNumber(day: CalendarDay): number {
  return Math.round(Date.UTC(day.year, day.month - 1, day.day) / 86_400_000);
}

/** Days from one calendar day to another. Negative when the second is earlier. */
export function daysBetween(from: CalendarDay, to: CalendarDay): number {
  return dayNumber(to) - dayNumber(from);
}

/** Today's date on the person's own clock. */
export function calendarDayOf(now: Date): CalendarDay {
  return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** "Fri 20 Nov", or "Fri 29 Oct 2027" when it is not this year. */
export function formatCalendarDay(day: CalendarDay, thisYear: number): string {
  const weekday = WEEKDAYS[new Date(Date.UTC(day.year, day.month - 1, day.day)).getUTCDay()];
  const text = `${weekday} ${day.day} ${MONTHS[day.month - 1]}`;
  return day.year === thisYear ? text : `${text} ${day.year}`;
}
