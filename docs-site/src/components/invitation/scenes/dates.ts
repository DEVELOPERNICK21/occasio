import { parseDay } from '../../../lib/invitation';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

/** 1 as "1st", 2 as "2nd", 23 as "23rd", 11 as "11th". */
export function ordinal(day: number): string {
  const tens = day % 100;
  if (tens >= 11 && tens <= 13) return `${day}th`;
  switch (day % 10) {
    case 1:
      return `${day}st`;
    case 2:
      return `${day}nd`;
    case 3:
      return `${day}rd`;
    default:
      return `${day}th`;
  }
}

/**
 * The days a celebration covers, the way an invitation writes them: "23rd February 2027" for one
 * day, "23rd - 27th February 2027" for several in a month, "28th February - 2nd March 2027" across
 * two. Empty when the first day is not a real day.
 */
export function dateSpan(first: string, last: string = first): string {
  const from = parseDay(first);
  if (!from) return '';
  const to = parseDay(last) ?? from;
  const sameDay = from.year === to.year && from.month === to.month && from.day === to.day;
  const start = ordinal(from.day);
  const startMonth = MONTHS[from.month - 1]!;
  if (sameDay) return `${start} ${startMonth} ${from.year}`;
  const end = ordinal(to.day);
  const endMonth = MONTHS[to.month - 1]!;
  if (from.year === to.year && from.month === to.month) return `${start} - ${end} ${startMonth} ${from.year}`;
  if (from.year === to.year) return `${start} ${startMonth} - ${end} ${endMonth} ${from.year}`;
  return `${start} ${startMonth} ${from.year} - ${end} ${endMonth} ${to.year}`;
}
