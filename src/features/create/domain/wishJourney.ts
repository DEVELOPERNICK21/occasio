/**
 * Light gamification for Create home — derived only from real History + Vault
 * counts. No invented points, no pressure copy.
 */

export type WishLevel = {
  level: number;
  title: string;
  minWishes: number;
};

export const WISH_LEVELS: readonly WishLevel[] = [
  { level: 1, title: 'First spark', minWishes: 0 },
  { level: 2, title: 'Warm heart', minWishes: 1 },
  { level: 3, title: 'Thoughtful', minWishes: 3 },
  { level: 4, title: 'Memory keeper', minWishes: 7 },
  { level: 5, title: 'Heart of the family', minWishes: 15 },
];

export type WishBadgeId =
  | 'first_wish'
  | 'three_wishes'
  | 'vault_saved'
  | 'streak_two'
  | 'five_people';

export type WishBadge = {
  id: WishBadgeId;
  label: string;
  unlocked: boolean;
};

export type WishJourney = {
  totalWishes: number;
  level: WishLevel;
  nextLevel: WishLevel | null;
  /** 0–1 progress from current level floor to next level. */
  progress: number;
  wishesToNext: number;
  /** Consecutive calendar months with at least one wish. */
  streakMonths: number;
  /** Streak still alive but no wish yet this month. */
  streakAtRisk: boolean;
  badges: WishBadge[];
  caption: string;
};

export const BADGE_DESCRIPTIONS: Record<WishBadgeId, string> = {
  first_wish: 'You sent your first wish. Someone felt remembered today.',
  three_wishes: 'Three wishes sent. Small moments add up.',
  vault_saved: 'Someone is saved in your Vault. Their day won’t slip by.',
  streak_two: 'Two months in a row. You keep showing up for people.',
  five_people: 'Five different people have heard from you.',
};

/** Unlocked badges not yet celebrated, in display order. */
export function newlyEarnedBadges(
  badges: readonly WishBadge[],
  seenIds: readonly WishBadgeId[],
): WishBadge[] {
  const seen = new Set(seenIds);
  return badges.filter((badge) => badge.unlocked && !seen.has(badge.id));
}

type DatedEntry = { createdAt: string; recipientName: string };

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}`;
}

export function computeWishStreak(
  entries: readonly DatedEntry[],
  now = new Date(),
): { months: number; atRisk: boolean } {
  const months = new Set<string>();
  for (const entry of entries) {
    const created = new Date(entry.createdAt);
    if (!Number.isNaN(created.getTime())) {
      months.add(monthKey(created));
    }
  }

  const cursor = new Date(now.getFullYear(), now.getMonth(), 1);
  const hasThisMonth = months.has(monthKey(cursor));
  if (!hasThisMonth) {
    cursor.setMonth(cursor.getMonth() - 1);
  }

  let count = 0;
  while (months.has(monthKey(cursor))) {
    count += 1;
    cursor.setMonth(cursor.getMonth() - 1);
  }

  return { months: count, atRisk: count > 0 && !hasThisMonth };
}

export function levelForWishes(totalWishes: number): {
  level: WishLevel;
  nextLevel: WishLevel | null;
} {
  let index = 0;
  for (let i = 0; i < WISH_LEVELS.length; i += 1) {
    if (totalWishes >= WISH_LEVELS[i]!.minWishes) {
      index = i;
    }
  }
  return {
    level: WISH_LEVELS[index]!,
    nextLevel: WISH_LEVELS[index + 1] ?? null,
  };
}

function distinctRecipients(entries: readonly DatedEntry[]): number {
  const names = new Set<string>();
  for (const entry of entries) {
    const name = entry.recipientName.trim().toLowerCase();
    if (name) names.add(name);
  }
  return names.size;
}

export function computeWishJourney(
  entries: readonly DatedEntry[],
  vaultPeopleCount: number,
  now = new Date(),
): WishJourney {
  const totalWishes = entries.length;
  const { level, nextLevel } = levelForWishes(totalWishes);
  const streak = computeWishStreak(entries, now);
  const recipients = distinctRecipients(entries);

  const span = nextLevel ? nextLevel.minWishes - level.minWishes : 1;
  const progress = nextLevel
    ? Math.min(1, Math.max(0, (totalWishes - level.minWishes) / span))
    : 1;
  const wishesToNext = nextLevel ? nextLevel.minWishes - totalWishes : 0;

  const badges: WishBadge[] = [
    { id: 'first_wish', label: 'First wish', unlocked: totalWishes >= 1 },
    { id: 'three_wishes', label: '3 wishes', unlocked: totalWishes >= 3 },
    { id: 'vault_saved', label: 'Vault', unlocked: vaultPeopleCount >= 1 },
    { id: 'streak_two', label: '2-month streak', unlocked: streak.months >= 2 },
    { id: 'five_people', label: '5 people', unlocked: recipients >= 5 },
  ];

  let caption: string;
  if (totalWishes === 0) {
    caption = 'Send your first wish to earn your first badge.';
  } else if (streak.atRisk) {
    caption = 'One wish this month keeps your streak going.';
  } else if (nextLevel) {
    const noun = wishesToNext === 1 ? 'wish' : 'wishes';
    caption = `${wishesToNext} more ${noun} to reach ${nextLevel.title}.`;
  } else {
    caption = 'Top level reached. Every wish still counts.';
  }

  return {
    totalWishes,
    level,
    nextLevel,
    progress,
    wishesToNext,
    streakMonths: streak.months,
    streakAtRisk: streak.atRisk,
    badges,
    caption,
  };
}
