import { daysUntilPersonDate } from './personRules';
import type { AutoSendPack, VaultPerson } from './types';

/** What arming really does. WhatsApp and SMS are not sent by us. */
export const AUTO_SEND_DELIVERY_COPY =
  'We prepare the card on the day and ask you to review it. We email it only if they agreed; otherwise you share the link.';

export function formatArmedOccasions(person: {
  autoSendBirthday: boolean;
  autoSendAnniversary: boolean;
}): string {
  const parts: string[] = [];
  if (person.autoSendBirthday) parts.push('Birthday');
  if (person.autoSendAnniversary) parts.push('Anniversary');
  if (parts.length === 0) return 'Not armed';
  return parts.join(' · ');
}

export function formatPackSummary(
  pack: AutoSendPack | null,
  lastCreationId: string | null,
): string {
  const message = pack?.defaultMessage.trim() ?? '';
  const photos = pack?.photoRefs.length ?? 0;

  if (!message && photos === 0) {
    return lastCreationId
      ? 'Uses last saved card for photos'
      : 'No message yet. Photos come from your last card or Create.';
  }

  const bits: string[] = [];
  if (message) bits.push(message);
  if (photos > 0) {
    bits.push(photos === 1 ? '1 photo' : `${photos} photos`);
  } else {
    bits.push('Photos from last card or Create');
  }
  return bits.join(' · ');
}

export type PersonNextOccasion = {
  /** Which occasion is next; the UI picks the icon. 'none' when no date is saved. */
  kind: 'birthday' | 'anniversary' | 'none';
  headline: string;
  hasDate: boolean;
};

function formatCountdown(daysUntil: number): string {
  if (daysUntil === 0) return 'today';
  if (daysUntil === 1) return 'tomorrow';
  return `in ${daysUntil} days`;
}

type OccasionCandidate = {
  kind: 'birthday' | 'anniversary';
  label: string;
  daysUntil: number;
};

function nextOccasionCandidate(
  kind: 'birthday' | 'anniversary',
  label: string,
  date: VaultPerson['birthday'],
  now: Date,
): OccasionCandidate | null {
  if (!date) return null;
  return {
    kind,
    label,
    daysUntil: daysUntilPersonDate(date, now),
  };
}

export function getPersonNextOccasion(
  person: VaultPerson,
  now = new Date(),
): PersonNextOccasion {
  const candidates = [
    nextOccasionCandidate('birthday', 'Birthday', person.birthday, now),
    nextOccasionCandidate(
      'anniversary',
      'Anniversary',
      person.anniversary,
      now,
    ),
  ].filter((candidate): candidate is OccasionCandidate => candidate !== null);

  if (candidates.length === 0) {
    return {
      kind: 'none',
      headline: 'Add a birthday to track',
      hasDate: false,
    };
  }

  const nearest = candidates.reduce((best, current) =>
    current.daysUntil < best.daysUntil ? current : best,
  );

  return {
    kind: nearest.kind,
    headline: `${nearest.label} ${formatCountdown(nearest.daysUntil)}`,
    hasDate: true,
  };
}

/** Days until the nearest saved occasion, or null when no date is saved. */
export function nextOccasionDays(
  person: VaultPerson,
  now = new Date(),
): number | null {
  const days = [person.birthday, person.anniversary]
    .filter((date): date is NonNullable<typeof date> => date !== null)
    .map((date) => daysUntilPersonDate(date, now));
  return days.length === 0 ? null : Math.min(...days);
}

export type VaultSectionKey = 'week' | 'month' | 'later' | 'noDate';

export type VaultSection = {
  key: VaultSectionKey;
  title: string;
  people: VaultPerson[];
};

const WEEK_DAYS = 7;
const MONTH_DAYS = 30;

const SECTION_TITLES: Record<VaultSectionKey, string> = {
  week: 'This week',
  month: 'This month',
  later: 'Later',
  noDate: 'No date yet',
};

/** Sort by next occasion and bucket for the Vault list. Empty sections are dropped. */
export function groupVaultPeople(
  people: VaultPerson[],
  now = new Date(),
): VaultSection[] {
  const buckets: Record<VaultSectionKey, { person: VaultPerson; days: number }[]> = {
    week: [],
    month: [],
    later: [],
    noDate: [],
  };

  for (const person of people) {
    const days = nextOccasionDays(person, now);
    const key: VaultSectionKey =
      days === null
        ? 'noDate'
        : days <= WEEK_DAYS
          ? 'week'
          : days <= MONTH_DAYS
            ? 'month'
            : 'later';
    buckets[key].push({ person, days: days ?? 0 });
  }

  const order: VaultSectionKey[] = ['week', 'month', 'later', 'noDate'];
  return order
    .map((key) => ({
      key,
      title: SECTION_TITLES[key],
      people: buckets[key]
        .sort(
          (a, b) =>
            a.days - b.days || a.person.personName.localeCompare(b.person.personName),
        )
        .map((item) => item.person),
    }))
    .filter((section) => section.people.length > 0);
}

export function filterVaultPeople(
  people: VaultPerson[],
  query: string,
): VaultPerson[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return people;
  return people.filter((person) =>
    person.personName.toLowerCase().includes(needle),
  );
}

/** How soon counts as "coming up" for the Vault tab's badge. */
export const COMING_UP_DAYS = 7;

/**
 * How many saved people have a birthday or anniversary today or within the next
 * `withinDays` days. One person counts once, even when both dates are close.
 */
export function countComingUp(
  people: readonly Pick<VaultPerson, 'birthday' | 'anniversary'>[],
  now = new Date(),
  withinDays = COMING_UP_DAYS,
): number {
  return people.filter((person) =>
    [person.birthday, person.anniversary].some(
      (date) => date !== null && date !== undefined && daysUntilPersonDate(date, now) <= withinDays,
    ),
  ).length;
}
