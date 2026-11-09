/**
 * Light gamification for Create home and the badges screen: derived only from real History + Vault
 * counts. No invented points, no pressure copy. Every badge says how it is earned, what Pip says when it
 * is, and what to do next, so earning one leads to making the next card.
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
  | 'ten_wishes'
  | 'vault_saved'
  | 'five_people'
  | 'streak_two'
  | 'thank_you'
  | 'anniversary'
  | 'invitation'
  | 'three_occasions'
  | 'auto_send';

/** How Pip looks when he celebrates it. Matches the mascot's moods. */
export type BadgePipMood = 'joy' | 'wink' | 'hopeful';

/** What the celebration offers to do next. */
export type BadgeNextStep = 'create' | 'vault';

export type WishBadge = {
  id: WishBadgeId;
  label: string;
  unlocked: boolean;
  /** How far along: `have` of `need`. */
  have: number;
  need: number;
  /** How to earn it, in the person's terms ("3 more wishes to earn this."). */
  hint: string;
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
  /** The locked badge that is closest to done: the one to aim for next. */
  nextBadge: WishBadge | null;
  /** First name of the person who got their first wish, for Pip to mention. */
  firstRecipient: string | null;
  caption: string;
};

type DatedEntry = { createdAt: string; recipientName: string; templateType?: string };

/** Everything the badges are counted from. */
type Tally = {
  wishes: number;
  recipients: number;
  vaultPeople: number;
  armedAutoSend: number;
  streakMonths: number;
  byType: Record<string, number>;
  occasionKinds: number;
};

type BadgeSpec = {
  id: WishBadgeId;
  label: string;
  need: number;
  have: (tally: Tally) => number;
  /** Said once it is earned. */
  description: string;
  hint: (remaining: number) => string;
  /** Pip's words when it is earned. `name` is the first person they wished, when it is known. */
  pip: { mood: BadgePipMood; line: (name: string | null) => string };
  next: BadgeNextStep;
};

const plural = (count: number, one: string, many: string) => (count === 1 ? one : many);

/** In the order they are shown. */
const SPECS: readonly BadgeSpec[] = [
  {
    id: 'first_wish',
    label: 'First wish',
    need: 1,
    have: (t) => t.wishes,
    description: 'You sent your first wish. Someone felt remembered today.',
    hint: () => 'Send your first wish.',
    pip: {
      mood: 'joy',
      line: (name) => `${name ?? 'They'} will open it soon, and know you thought of them.`,
    },
    next: 'create',
  },
  {
    id: 'three_wishes',
    label: '3 wishes',
    need: 3,
    have: (t) => t.wishes,
    description: 'Three wishes sent. Small moments add up.',
    hint: (n) => `${n} more ${plural(n, 'wish', 'wishes')} to earn this.`,
    pip: { mood: 'wink', line: () => 'Three people now know you care. Who is next?' },
    next: 'create',
  },
  {
    id: 'ten_wishes',
    label: '10 wishes',
    need: 10,
    have: (t) => t.wishes,
    description: 'Ten wishes sent. You are the one who remembers.',
    hint: (n) => `${n} more ${plural(n, 'wish', 'wishes')} to earn this.`,
    pip: { mood: 'joy', line: () => 'Ten smiles, and you caused every one. I kept count.' },
    next: 'create',
  },
  {
    id: 'vault_saved',
    label: 'Vault',
    need: 1,
    have: (t) => t.vaultPeople,
    description: 'Someone is saved in your Vault. Their day won’t slip by.',
    hint: () => 'Save someone in your Vault.',
    pip: { mood: 'hopeful', line: () => 'I will remember their day, so you never have to scramble.' },
    next: 'vault',
  },
  {
    id: 'five_people',
    label: '5 people',
    need: 5,
    have: (t) => t.recipients,
    description: 'Five different people have heard from you.',
    hint: (n) => `${n} more ${plural(n, 'person', 'people')} to hear from you.`,
    pip: { mood: 'wink', line: () => 'Your circle is getting warmer. Is anyone missing from it?' },
    next: 'create',
  },
  {
    id: 'streak_two',
    label: '2-month streak',
    need: 2,
    have: (t) => t.streakMonths,
    description: 'Two months in a row. You keep showing up for people.',
    hint: () => 'Send a wish two months in a row.',
    pip: { mood: 'joy', line: () => 'You keep showing up. People notice, even when they do not say so.' },
    next: 'create',
  },
  {
    id: 'thank_you',
    label: 'Thank you',
    need: 1,
    have: (t) => t.byType.thank_you ?? 0,
    description: 'You said thank you. Not many people do.',
    hint: () => 'Send a thank you card.',
    pip: { mood: 'joy', line: () => 'Gratitude lands harder than you think.' },
    next: 'create',
  },
  {
    id: 'anniversary',
    label: 'Anniversary',
    need: 1,
    have: (t) => t.byType.anniversary ?? 0,
    description: 'An anniversary card sent. Love, remembered.',
    hint: () => 'Send an anniversary card.',
    pip: { mood: 'wink', line: () => 'Some dates are worth more than any gift.' },
    next: 'create',
  },
  {
    id: 'invitation',
    label: 'Host',
    need: 1,
    have: (t) => t.byType.invitation ?? 0,
    description: 'Your first invitation is out. People will gather because of you.',
    hint: () => 'Send an invitation.',
    pip: { mood: 'joy', line: () => 'Somewhere, someone just marked the date.' },
    next: 'create',
  },
  {
    id: 'three_occasions',
    label: '3 occasions',
    need: 3,
    have: (t) => t.occasionKinds,
    description: 'Three kinds of moments, all remembered.',
    hint: (n) => `${n} more ${plural(n, 'kind', 'kinds')} of occasion to try.`,
    pip: { mood: 'wink', line: () => 'Birthdays, thank yous, anniversaries. You celebrate people, not just dates.' },
    next: 'create',
  },
  {
    id: 'auto_send',
    label: 'Autopilot',
    need: 1,
    have: (t) => t.armedAutoSend,
    description: 'Auto-send is armed. Their day is covered.',
    hint: () => 'Arm auto-send for someone in your Vault.',
    pip: { mood: 'hopeful', line: () => 'I will have their card ready on the day. You just say yes.' },
    next: 'create',
  },
];

const SPEC_BY_ID = new Map(SPECS.map((spec) => [spec.id, spec]));

/** Bump when badges are added, so people who already qualify are not shown a string of celebrations. */
export const BADGE_SET_VERSION = 2;

export const BADGE_DESCRIPTIONS = Object.fromEntries(
  SPECS.map((spec) => [spec.id, spec.description]),
) as Record<WishBadgeId, string>;

export function badgeNextStep(id: WishBadgeId): BadgeNextStep {
  return SPEC_BY_ID.get(id)?.next ?? 'create';
}

/**
 * Pip's words for an earned badge, in his voice: short, warm, specific. `firstName` is the first person
 * they wished (only the first wish uses it).
 */
export function badgePipLine(id: WishBadgeId, firstName: string | null = null): string {
  return SPEC_BY_ID.get(id)?.pip.line(firstName) ?? 'You made someone feel remembered.';
}

export function badgePipMood(id: WishBadgeId): BadgePipMood {
  return SPEC_BY_ID.get(id)?.pip.mood ?? 'joy';
}

/** Unlocked badges not yet celebrated, in display order. */
export function newlyEarnedBadges(
  badges: readonly WishBadge[],
  seenIds: readonly WishBadgeId[],
): WishBadge[] {
  const seen = new Set(seenIds);
  return badges.filter((badge) => badge.unlocked && !seen.has(badge.id));
}

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

/** The first name of whoever got their first wish, or null. */
export function firstWishRecipient(entries: readonly DatedEntry[]): string | null {
  let oldest: DatedEntry | null = null;
  for (const entry of entries) {
    const time = new Date(entry.createdAt).getTime();
    if (Number.isNaN(time)) continue;
    if (!oldest || time < new Date(oldest.createdAt).getTime()) oldest = entry;
  }
  const first = oldest?.recipientName.trim().split(/\s+/)[0] ?? '';
  return first || null;
}

/** How many people have auto-send armed for a birthday or an anniversary. */
export function countArmedAutoSend(
  people: ReadonlyArray<{ autoSendBirthday: boolean; autoSendAnniversary: boolean }>,
): number {
  return people.filter((p) => p.autoSendBirthday || p.autoSendAnniversary).length;
}

type Extras = {
  /** People in the Vault with auto-send armed for a birthday or an anniversary. */
  armedAutoSend?: number;
};

export function computeWishJourney(
  entries: readonly DatedEntry[],
  vaultPeopleCount: number,
  now = new Date(),
  extras: Extras = {},
): WishJourney {
  const totalWishes = entries.length;
  const { level, nextLevel } = levelForWishes(totalWishes);
  const streak = computeWishStreak(entries, now);

  const byType: Record<string, number> = {};
  for (const entry of entries) {
    if (entry.templateType) byType[entry.templateType] = (byType[entry.templateType] ?? 0) + 1;
  }
  const tally: Tally = {
    wishes: totalWishes,
    recipients: distinctRecipients(entries),
    vaultPeople: vaultPeopleCount,
    armedAutoSend: extras.armedAutoSend ?? 0,
    streakMonths: streak.months,
    byType,
    occasionKinds: Object.keys(byType).length,
  };

  const span = nextLevel ? nextLevel.minWishes - level.minWishes : 1;
  const progress = nextLevel
    ? Math.min(1, Math.max(0, (totalWishes - level.minWishes) / span))
    : 1;
  const wishesToNext = nextLevel ? nextLevel.minWishes - totalWishes : 0;

  const badges: WishBadge[] = SPECS.map((spec) => {
    const have = spec.have(tally);
    return {
      id: spec.id,
      label: spec.label,
      unlocked: have >= spec.need,
      have: Math.min(have, spec.need),
      need: spec.need,
      hint: spec.hint(Math.max(1, spec.need - have)),
    };
  });

  // Aim at the one that is closest to done; on a tie, the earlier one in the list.
  let nextBadge: WishBadge | null = null;
  for (const badge of badges) {
    if (badge.unlocked) continue;
    if (!nextBadge || badge.have / badge.need > nextBadge.have / nextBadge.need) nextBadge = badge;
  }

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
    nextBadge,
    firstRecipient: firstWishRecipient(entries),
    caption,
  };
}
