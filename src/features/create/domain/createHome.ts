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
      body: 'Start with who it is for, add a photo, and share a link — no account required.',
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
    return 'A photo and a few honest words. Share a private link — no account needed.';
  }

  const nearestDays = upcoming[0]?.daysUntil;
  if (typeof nearestDays === 'number' && nearestDays <= 7) {
    return 'Someone you care about has a date soon. Start with who it’s for.';
  }

  return 'Start with who it’s for — the rest takes about two minutes.';
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
