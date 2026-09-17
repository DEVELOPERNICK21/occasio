import type { IstCalendarDate, OccasionType, PersonDate } from './types';

const IST_TIME_ZONE = 'Asia/Kolkata';

function partValue(
  parts: Intl.DateTimeFormatPart[],
  type: Intl.DateTimeFormatPartTypes,
): number {
  const value = parts.find((part) => part.type === type)?.value;
  return Number(value);
}

export function istCalendarDate(now: Date): IstCalendarDate {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: IST_TIME_ZONE,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(now);

  return {
    year: partValue(parts, 'year'),
    month: partValue(parts, 'month'),
    day: partValue(parts, 'day'),
  };
}

export function matchesMonthDay(
  date: PersonDate | undefined,
  today: Pick<IstCalendarDate, 'month' | 'day'>,
): boolean {
  if (!date) return false;
  return date.month === today.month && date.day === today.day;
}

export function buildIdempotencyKey(
  userId: string,
  relationshipId: string,
  occasionType: OccasionType,
  year: number,
): string {
  return `${userId}_${relationshipId}_${occasionType}_${year}`;
}

export function formatIstDate(today: IstCalendarDate): string {
  const month = String(today.month).padStart(2, '0');
  const day = String(today.day).padStart(2, '0');
  return `${today.year}-${month}-${day}`;
}
