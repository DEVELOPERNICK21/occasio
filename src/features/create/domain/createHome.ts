import type { HistoryEntry } from '../../history/domain/types';
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

export function countWishesThisMonth(entries: HistoryEntry[], now = new Date()): number {
  const month = now.getMonth();
  const year = now.getFullYear();

  return entries.filter((entry) => {
    const created = new Date(entry.createdAt);
    return created.getMonth() === month && created.getFullYear() === year;
  }).length;
}

export function getMilestoneLine(wishCount: number): string | null {
  if (wishCount <= 0) {
    return 'Your first wish takes about two minutes.';
  }
  if (wishCount === 1) {
    return "You've shared 1 wish this month.";
  }
  return `You've shared ${wishCount} wishes this month.`;
}

export type MilestoneCardContent = {
  eyebrow: string;
  headline: string;
  /** Substring of headline to emphasize — must match real data, never inflated. */
  headlineHighlight?: string;
  body: string;
};

export function getMilestoneCardContent(
  wishCount: number,
  isSignedIn: boolean,
  vaultPeopleCount = 0,
): MilestoneCardContent {
  if (!isSignedIn) {
    return {
      eyebrow: 'Getting started',
      headline: 'Your first wish takes about two minutes',
      body: 'Pick an occasion, add a photo, and share a link — no account required.',
    };
  }

  if (wishCount >= 2) {
    const highlight = String(wishCount);
    return {
      eyebrow: 'Milestone reached',
      headline: `You've shared ${wishCount} wishes this month`,
      headlineHighlight: highlight,
      body: 'Small gestures add up. Vault keeps their dates ready for the next one.',
    };
  }

  if (wishCount === 1) {
    return {
      eyebrow: 'Milestone reached',
      headline: "You've shared 1 wish this month",
      headlineHighlight: '1',
      body: 'Small gestures add up. Vault keeps their dates ready for the next one.',
    };
  }

  if (vaultPeopleCount > 0) {
    const highlight = String(vaultPeopleCount);
    const noun = vaultPeopleCount === 1 ? 'person' : 'people';
    return {
      eyebrow: 'Your vault',
      headline: `You're tracking ${vaultPeopleCount} ${noun}`,
      headlineHighlight: highlight,
      body: 'We surface their dates here when it is time to reach out — no spam, no guilt.',
    };
  }

  return {
    eyebrow: 'This month',
    headline: 'Ready when someone matters',
    body: 'Create a wish today — a real photo and a few honest words go far.',
  };
}

export function getCreateHomeSubtitle(
  isSignedIn: boolean,
  upcoming: readonly UpcomingOccasion[],
): string {
  if (!isSignedIn) {
    return 'Pick an occasion — share a personal link in minutes. No account needed.';
  }

  const nearestDays = upcoming[0]?.daysUntil;
  if (typeof nearestDays === 'number' && nearestDays <= 7) {
    return 'Someone you care about has a date coming up. A small gesture goes far.';
  }

  return 'Pick the occasion, then add photos and your message.';
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
