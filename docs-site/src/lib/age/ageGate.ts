/**
 * COPPA age rules, server side. The mobile app has its own copy of this file's
 * logic for instant form feedback (`src/features/age/domain/ageGate.ts`); the
 * server result is the one that counts.
 */
export const MINIMUM_AGE = 13;
const OLDEST_YEAR = 1900;

export type DateOfBirth = { year: number; month: number; day: number };

function toInt(value: unknown): number | null {
  if (typeof value === 'number' && Number.isInteger(value)) return value;
  if (typeof value === 'string' && /^\d{1,4}$/.test(value.trim())) {
    return Number.parseInt(value.trim(), 10);
  }
  return null;
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/**
 * "Today" for the age check, in the most forward time zone (UTC+14). The app judges
 * the date on the person's own phone; a server that counted in UTC would refuse
 * someone on their 13th birthday for the hours when it is already tomorrow where
 * they live, and the app would then block them for good. This never refuses
 * anyone their own local calendar would accept.
 */
export function checkDate(now: Date = new Date()): Date {
  return new Date(now.getTime() + 14 * 60 * 60 * 1000);
}

/** A real calendar date in the past (and not absurdly old); anything else is `null`. */
export function parseDateOfBirth(
  input: { year?: unknown; month?: unknown; day?: unknown } | null | undefined,
  now: Date = new Date(),
): DateOfBirth | null {
  if (!input) return null;
  const year = toInt(input.year);
  const month = toInt(input.month);
  const day = toInt(input.day);
  if (year === null || month === null || day === null) return null;
  if (year < OLDEST_YEAR || month < 1 || month > 12 || day < 1) return null;
  if (day > daysInMonth(year, month)) return null;

  const born = Date.UTC(year, month - 1, day);
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  if (born > today) return null;
  return { year, month, day };
}

/** Whole years completed on `on`. A birthday counts from the first moment of that day. */
export function ageOn(dob: DateOfBirth, on: Date = new Date()): number {
  let age = on.getUTCFullYear() - dob.year;
  const beforeBirthday =
    on.getUTCMonth() + 1 < dob.month ||
    (on.getUTCMonth() + 1 === dob.month && on.getUTCDate() < dob.day);
  if (beforeBirthday) age -= 1;
  return age;
}

export function isOldEnough(dob: DateOfBirth, on: Date = new Date()): boolean {
  return ageOn(dob, on) >= MINIMUM_AGE;
}
