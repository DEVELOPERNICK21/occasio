/**
 * The 13+ rule (COPPA). The server repeats every check; this copy exists so the
 * form can answer instantly. Dates are calendar dates, so no time zone matters.
 */
export const MINIMUM_AGE = 13;
const OLDEST_YEAR = 1900;

export type DateOfBirth = { year: number; month: number; day: number };
export type DobInput = { year: string; month: string; day: string };

function toInt(value: string): number | null {
  const trimmed = value.trim();
  return /^\d{1,4}$/.test(trimmed) ? Number.parseInt(trimmed, 10) : null;
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** A real calendar date in the past, or `null`. */
export function parseDateOfBirth(input: DobInput, now: Date = new Date()): DateOfBirth | null {
  const year = toInt(input.year);
  const month = toInt(input.month);
  const day = toInt(input.day);
  if (year === null || month === null || day === null) return null;
  if (input.year.trim().length !== 4) return null;
  if (year < OLDEST_YEAR || month < 1 || month > 12 || day < 1) return null;
  if (day > daysInMonth(year, month)) return null;

  const born = Date.UTC(year, month - 1, day);
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return born > today ? null : { year, month, day };
}

export function ageOn(dob: DateOfBirth, on: Date = new Date()): number {
  let age = on.getFullYear() - dob.year;
  const before =
    on.getMonth() + 1 < dob.month || (on.getMonth() + 1 === dob.month && on.getDate() < dob.day);
  return before ? age - 1 : age;
}

export function isOldEnough(dob: DateOfBirth, on: Date = new Date()): boolean {
  return ageOn(dob, on) >= MINIMUM_AGE;
}

export type AgeState =
  | { status: 'unknown' }
  | { status: 'confirmed'; attestation: string; at: string }
  | { status: 'blocked'; at: string };

export const AGE_COPY = {
  title: 'When were you born?',
  body: 'We check this once to make sure Occasio is right for you. We do not save your birthday.',
  invalid: 'Enter a real date, like 14 / 08 / 1995.',
  offline: 'Could not check right now. Check your connection and try again.',
  blockedTitle: 'Occasio is not available for you',
  blockedBody:
    'We cannot create an account or collect information from people who are too young to use Occasio. Nothing you entered was saved.',
  blockedHelp: 'If you think this is a mistake, a parent or guardian can write to us.',
} as const;
