import { daysUntilPersonDate } from '../../vault/domain/personRules';
import { relationshipLabel } from '../../vault/domain/relationshipTypes';
import type { VaultPerson } from '../../vault/domain/types';

export type UpcomingOccasion = {
  personId: string;
  personName: string;
  relationshipLabel: string;
  daysUntil: number;
  label: string;
};

export function formatOccasionCountdown(daysUntil: number): string {
  if (daysUntil === 0) return 'Today';
  if (daysUntil === 1) return 'Tomorrow';
  return `${daysUntil} days`;
}

/**
 * Gentle prompt for an upcoming date — invitation, not guilt.
 * (Avoid "don't forget" / countdown pressure.)
 */
export function upcomingOccasionPrompt(
  personName: string,
  daysUntil: number,
): string {
  const first = personName.trim().split(/\s+/)[0] || 'them';
  if (daysUntil === 0) {
    return `A small wish for ${first} would mean a lot today.`;
  }
  if (daysUntil === 1) {
    return `Tomorrow is ${first}'s day — a photo and a few words go far.`;
  }
  if (daysUntil <= 7) {
    return `${first}'s birthday is close. Start a card when you have a minute.`;
  }
  if (daysUntil <= 30) {
    return `Plenty of time — a card for ${first} can wait until it feels right.`;
  }
  return `Save the date for ${first}. When you are ready, start here.`;
}

export function getUpcomingOccasionsFromVault(
  people: VaultPerson[],
  max = 2,
  now = new Date(),
): UpcomingOccasion[] {
  return people
    .filter((person) => person.birthday)
    .map((person) => {
      const daysUntil = daysUntilPersonDate(person.birthday!, now);
      return {
        personId: person.id,
        personName: person.personName,
        relationshipLabel: relationshipLabel(person.relationshipType),
        daysUntil,
        label: `${person.personName}'s birthday`,
      };
    })
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, max);
}

export type CreateHomeHero = {
  greeting: string;
  headline: string;
  line: string;
};

/** First-fold copy — readable in ~2 seconds. */
export function getCreateHomeHero(
  isSignedIn: boolean,
  upcoming: readonly UpcomingOccasion[],
  now = new Date(),
): CreateHomeHero {
  const hour = now.getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const nearest = upcoming[0];
  if (isSignedIn && nearest && nearest.daysUntil <= 7) {
    const first = nearest.personName.trim().split(/\s+/)[0] || 'them';
    return {
      greeting,
      headline: `A moment for ${first}?`,
      line: 'Pick who it’s for — or start a quick wish below.',
    };
  }

  return {
    greeting,
    headline: 'Who needs to feel remembered?',
    line: 'Tap a person. Add a photo. Share a private link.',
  };
}

export type VaultNudgeContent = {
  title: string;
  body: string;
  actionLabel: string;
};

/** High-contrast nudge — only when Vault can add value (no upcoming cards yet). */
export function shouldShowVaultNudge(
  upcomingCount: number,
  vaultLoading: boolean,
): boolean {
  if (vaultLoading) {
    return false;
  }
  return upcomingCount === 0;
}

export function getVaultNudgeContent(
  isSignedIn: boolean,
  peopleCount: number,
): VaultNudgeContent {
  if (!isSignedIn) {
    return {
      title: 'Save dates in Vault',
      body: 'Sign in to add birthdays once — upcoming occasions show up here when it matters.',
      actionLabel: 'Sign in',
    };
  }

  if (peopleCount === 0) {
    return {
      title: 'Save dates in Vault',
      body: 'Add birthdays once — upcoming occasions show up here when it matters.',
      actionLabel: 'Open Vault',
    };
  }

  return {
    title: 'Add birthdays to Vault',
    body: 'Add a date for people you saved — we surface them here when it is time.',
    actionLabel: 'Open Vault',
  };
}
