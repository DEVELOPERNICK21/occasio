import { daysUntilPersonDate } from './personRules';
import type { VaultPerson } from './types';

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

export function getPersonNextOccasion(
  person: VaultPerson,
  now = new Date(),
): PersonNextOccasion {
  if (!person.birthday) {
    return {
      icon: '📅',
      headline: 'Add a birthday to track',
      hasDate: false,
    };
  }

  const daysUntil = daysUntilPersonDate(person.birthday, now);
  return {
    icon: '🎂',
    headline: `Birthday ${formatCountdown(daysUntil)}`,
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
