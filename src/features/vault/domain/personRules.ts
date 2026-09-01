import { normalizeIndiaPhone } from '../../auth/domain/phone';
import type {
  CreatePersonInput,
  PersonDate,
  PersonDraft,
  RelationshipType,
} from './types';

export type PersonValidationResult =
  | { ok: true; input: CreatePersonInput }
  | { ok: false; error: string };

function parsePersonDate(monthRaw: string, dayRaw: string): PersonDate | null {
  const month = Number.parseInt(monthRaw.trim(), 10);
  const day = Number.parseInt(dayRaw.trim(), 10);

  if (!monthRaw.trim() && !dayRaw.trim()) {
    return null;
  }

  if (
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return null;
  }

  return { month, day };
}

export function validatePersonDraft(
  draft: PersonDraft,
  options: { autoSendBirthday: boolean },
): PersonValidationResult {
  const personName = draft.personName.trim();
  if (personName.length < 1 || personName.length > 80) {
    return { ok: false, error: 'Enter a name (1–80 characters).' };
  }

  if (!draft.relationshipType) {
    return { ok: false, error: 'Pick a relationship.' };
  }

  const birthday = parsePersonDate(draft.birthdayMonth, draft.birthdayDay);
  if (
    (draft.birthdayMonth.trim() || draft.birthdayDay.trim()) &&
    birthday === null
  ) {
    return { ok: false, error: 'Birthday must be a valid month (1–12) and day (1–31).' };
  }

  if (options.autoSendBirthday && !birthday) {
    return { ok: false, error: 'Add a birthday before enabling auto-send.' };
  }

  const whatsappRaw = draft.whatsapp.trim();
  const whatsapp = whatsappRaw ? normalizeIndiaPhone(whatsappRaw) : null;
  if (whatsappRaw && !whatsapp) {
    return { ok: false, error: 'Enter a valid WhatsApp number or leave blank.' };
  }

  return {
    ok: true,
    input: {
      personName,
      relationshipType: draft.relationshipType as RelationshipType,
      birthday,
      whatsapp,
      autoSendBirthday: options.autoSendBirthday,
    },
  };
}

export function formatPersonDate(date: PersonDate): string {
  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  return `${date.day} ${monthNames[date.month - 1] ?? '?'}`;
}

/** Days until next occurrence of month/day (0 = today). */
export function daysUntilPersonDate(date: PersonDate, now = new Date()): number {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const year = today.getFullYear();
  let next = new Date(year, date.month - 1, date.day);
  if (next < today) {
    next = new Date(year + 1, date.month - 1, date.day);
  }
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((next.getTime() - today.getTime()) / msPerDay);
}
