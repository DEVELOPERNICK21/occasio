import { daysUntilPersonDate } from './personRules';
import type { AutoSendPack, VaultPerson } from './types';

export const AUTO_SEND_DELIVERY_COPY =
  'Armed for delivery when the date arrives';

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
  icon: string;
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
  icon: string;
  label: string;
  daysUntil: number;
};

function nextOccasionCandidate(
  kind: 'birthday' | 'anniversary',
  icon: string,
  label: string,
  date: VaultPerson['birthday'],
  now: Date,
): OccasionCandidate | null {
  if (!date) return null;
  return {
    kind,
    icon,
    label,
    daysUntil: daysUntilPersonDate(date, now),
  };
}

export function getPersonNextOccasion(
  person: VaultPerson,
  now = new Date(),
): PersonNextOccasion {
  const candidates = [
    nextOccasionCandidate('birthday', '🎂', 'Birthday', person.birthday, now),
    nextOccasionCandidate(
      'anniversary',
      '💍',
      'Anniversary',
      person.anniversary,
      now,
    ),
  ].filter((candidate): candidate is OccasionCandidate => candidate !== null);

  if (candidates.length === 0) {
    return {
      icon: '📅',
      headline: 'Add a birthday to track',
      hasDate: false,
    };
  }

  const nearest = candidates.reduce((best, current) =>
    current.daysUntil < best.daysUntil ? current : best,
  );

  return {
    icon: nearest.icon,
    headline: `${nearest.label} ${formatCountdown(nearest.daysUntil)}`,
    hasDate: true,
  };
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
