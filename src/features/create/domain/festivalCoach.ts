import { type CalendarDay } from './holidayDates';
import {
  HOLIDAYS,
  nextOccurrence,
  type Holiday,
  type HolidayGroup,
  type HolidayId,
  type HolidayOccurrence,
} from './holidays';
import type { Audience } from './templateSchema';

/**
 * The festival coach: what to put in front of this person, for whom, and when to say something.
 *
 * It exists so each festival is worth more than one card. Someone who makes a Diwali wish for one person
 * usually has four more they meant to write to; the coach finds them in the Vault, puts the nearest and most
 * relevant festival first, and offers "next" the moment a card is shared. It never guesses at feelings and it
 * never nags: every nudge is capped, can be snoozed, and says plainly what is on offer.
 *
 * Pure rules only. The device supplies the day, the Vault, the history and what was already shown.
 */

export type Region = 'IN' | 'US' | 'other';

/** The least the coach needs to know about someone saved in the Vault. */
export type CoachPerson = { id: string; name: string; relationship: string | null };
/** The least it needs to know about a card already made. */
export type CoachWish = { recipientName: string; templateType: string; createdAt: string };

/** What was shown and snoozed, kept on the device. Keys are "<festival id>:<year>". */
export type CoachState = {
  snoozed: Record<string, string>;
  shown: Record<string, { count: number; lastAt: string }>;
  lastNudgeAt: string | null;
  /** Which festival the last nudge was for ("<id>:<year>"), so it can carry on through that day. */
  lastNudgeKey: string | null;
  /** Plan prompts: when each was first shown, when each was put away, and when the last one appeared. */
  prompts: Record<string, string>;
  dismissedPrompts: Record<string, string>;
  lastPromptAt: string | null;
};

export const EMPTY_COACH_STATE: CoachState = {
  snoozed: {},
  shown: {},
  lastNudgeAt: null,
  lastNudgeKey: null,
  prompts: {},
  dismissedPrompts: {},
  lastPromptAt: null,
};

export type CoachInput = {
  now: Date;
  region: Region | null;
  people: readonly CoachPerson[];
  wishes: readonly CoachWish[];
  /** How many wishes can be made right now; null when not known. */
  wishesReady: number | null;
  state: CoachState;
};

export type SuggestionWhy = 'wished_last_year' | 'fits' | 'catch_up';

export type Suggestion = { person: CoachPerson; why: SuggestionWhy };

export type Reason = 'today' | 'soon' | 'wished_before' | 'same_family' | 'people_fit' | 'popular_here';

export type Opportunity = HolidayOccurrence & {
  /** 0 to 100. Higher is more worth putting in front of this person now. */
  score: number;
  reasons: Reason[];
  /** People worth a wish for this festival, best first, who have not had one this time. */
  suggested: Suggestion[];
  /** People who already got one this time. */
  alreadyWished: string[];
};

/* ------------------------------------------------------------------ the numbers */

const DAY_MS = 24 * 60 * 60 * 1000;

/** How far ahead the coach looks, in days, and how far back a festival is still worth a late wish. */
export const COACH_WINDOW_DAYS = 60;
export const COACH_GRACE_DAYS = 1;

/** The lowest score still shown on Home. */
export const MIN_SHOWN_SCORE = 20;
/** The lowest score that earns a nudge, how close the festival must be, and the limits on being heard from. */
export const NUDGE_MIN_SCORE = 55;
export const NUDGE_WITHIN_DAYS = 7;
export const NUDGE_MAX_PER_FESTIVAL = 2;
export const NUDGE_MIN_GAP_HOURS = 36;
/** With no wish to spend, say less: a nudge needs more reason and comes once. */
export const NUDGE_MIN_SCORE_NO_WISHES = 70;

/** How near a festival is, as a share of its pull: today is everything, next month is a little. */
export function timingWeight(daysUntil: number): number {
  if (daysUntil < 0) return 0.5;
  if (daysUntil === 0) return 1;
  if (daysUntil === 1) return 0.95;
  if (daysUntil <= 3) return 0.88;
  if (daysUntil <= 7) return 0.75;
  if (daysUntil <= 14) return 0.55;
  if (daysUntil <= 30) return 0.35;
  if (daysUntil <= 60) return 0.15;
  return 0.05;
}

/** How widely a kind of festival is kept where someone lives. A weak prior, outvoted by what they have sent. */
const REGION_WEIGHT: Record<Region | 'unknown', Record<HolidayGroup, number>> = {
  IN: { hindu: 1, new_year: 0.9, national: 1, muslim: 0.8, christian: 0.55, dharmic: 0.7, world: 0.75, jewish: 0.15 },
  US: { hindu: 0.45, new_year: 0.4, national: 0.1, muslim: 0.6, christian: 1, dharmic: 0.35, world: 1, jewish: 0.55 },
  other: { hindu: 0.4, new_year: 0.3, national: 0.1, muslim: 0.6, christian: 0.9, dharmic: 0.3, world: 0.9, jewish: 0.45 },
  unknown: { hindu: 0.6, new_year: 0.6, national: 0.6, muslim: 0.6, christian: 0.6, dharmic: 0.6, world: 0.6, jewish: 0.6 },
};

/** The region a device locale points to ("en-IN" is India, "en-US" the United States), or null if it does not say. */
export function regionFromLocale(locale: string | null | undefined): Region | null {
  const match = /[-_]([A-Za-z]{2})\b/.exec(locale ?? '');
  if (!match) return null;
  const country = match[1]!.toUpperCase();
  if (country === 'IN') return 'IN';
  if (country === 'US') return 'US';
  return 'other';
}

/** The relationships a festival is specifically for. A festival not listed is for anyone. */
const SPECIFIC_FIT: Partial<Record<HolidayId, readonly string[]>> = {
  mothers_day: ['mom'],
  fathers_day: ['dad'],
  raksha_bandhan: ['sibling'],
  bhai_dooj: ['sibling'],
  valentines_day: ['partner'],
  karwa_chauth: ['partner'],
  friendship_day: ['friend'],
};

/** Who the card is for, to pre-select the audience when a suggestion is tapped. */
export function audienceForRelationship(relationship: string | null): Audience {
  switch (relationship) {
    case 'mom':
      return 'mom';
    case 'dad':
      return 'dad';
    case 'partner':
      return 'partner';
    case 'friend':
      return 'friend';
    case 'sibling':
    case 'parent':
      return 'family';
    default:
      return 'someone_special';
  }
}

/* ------------------------------------------------------------------ names and history */

const norm = (name: string) => name.trim().toLowerCase().replace(/\s+/g, ' ');
const firstName = (name: string) => norm(name).split(' ')[0] ?? '';

function sameFirstPerson(a: string, b: string): boolean {
  const x = norm(a);
  const y = norm(b);
  return x === y || (firstName(a) !== '' && firstName(a) === firstName(b) && (x.split(' ').length === 1 || y.split(' ').length === 1));
}

const ageDays = (iso: string, now: Date): number => {
  const t = Date.parse(iso);
  return Number.isFinite(t) ? (now.getTime() - t) / DAY_MS : Number.POSITIVE_INFINITY;
};

/** The people this occurrence of a festival already got a wish, from the cards made around its day. */
function wishedAround(holiday: Holiday, date: CalendarDay, wishes: readonly CoachWish[], now: Date): string[] {
  const festival = Date.UTC(date.year, date.month - 1, date.day);
  return wishes
    .filter((w) => w.templateType === holiday.id)
    .filter((w) => {
      const made = Date.parse(w.createdAt);
      // Within 45 days either side of this year's date. `now` bounds it for a festival still ahead.
      return Number.isFinite(made) && Math.abs(made - festival) <= 45 * DAY_MS && made <= now.getTime() + DAY_MS;
    })
    .map((w) => w.recipientName);
}

/** Whom the festival was wished to a year ago, around the same day. */
function wishedLastTime(holiday: Holiday, date: CalendarDay, wishes: readonly CoachWish[]): string[] {
  const festival = Date.UTC(date.year, date.month - 1, date.day);
  return wishes
    .filter((w) => w.templateType === holiday.id)
    .filter((w) => {
      const made = Date.parse(w.createdAt);
      const gap = festival - made;
      return Number.isFinite(made) && gap > 45 * DAY_MS && gap < 500 * DAY_MS;
    })
    .map((w) => w.recipientName);
}

/* ------------------------------------------------------------------ who to wish */

/** People worth a wish for this festival, best first, leaving out anyone who already had one this time. */
export function suggestRecipients(
  holiday: Holiday,
  date: CalendarDay,
  people: readonly CoachPerson[],
  wishes: readonly CoachWish[],
  now: Date,
  max = 4,
): { suggested: Suggestion[]; alreadyWished: string[] } {
  const around = wishedAround(holiday, date, wishes, now);
  const lastTime = wishedLastTime(holiday, date, wishes);
  const specific = SPECIFIC_FIT[holiday.id as HolidayId];
  const isWished = (p: CoachPerson) => around.some((n) => sameFirstPerson(n, p.name));

  const candidates = people
    .filter((p) => !isWished(p))
    .map((person) => {
      const fits = specific ? specific.includes(person.relationship ?? '') : true;
      const lastYear = lastTime.some((n) => sameFirstPerson(n, person.name));
      const lastWish = wishes
        .filter((w) => sameFirstPerson(w.recipientName, person.name))
        .map((w) => ageDays(w.createdAt, now))
        .reduce((least, d) => Math.min(least, d), Number.POSITIVE_INFINITY);
      const catchUp = Math.min(2, (Number.isFinite(lastWish) ? lastWish : 365) / 180);
      const score = (specific && fits ? 3 : 0) + (lastYear ? 2.5 : 0) + catchUp;
      const why: SuggestionWhy = lastYear ? 'wished_last_year' : specific && fits ? 'fits' : 'catch_up';
      return { person, fits, score, why };
    })
    // A festival meant for one kind of person only suggests that kind: Mother's Day is not offered for a friend.
    .filter((c) => !specific || c.fits);

  candidates.sort((a, b) => b.score - a.score || a.person.name.localeCompare(b.person.name));
  return {
    suggested: candidates.slice(0, max).map(({ person, why }) => ({ person, why })),
    alreadyWished: people.filter(isWished).map((p) => p.name),
  };
}

/* ------------------------------------------------------------------ the ranking */

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/** What the person has shown they keep: the same festival before, or its kind. */
function affinity(holiday: Holiday, wishes: readonly CoachWish[], now: Date): { value: number; same: boolean; family: boolean } {
  const sameFestival = wishes.filter((w) => w.templateType === holiday.id);
  if (sameFestival.length > 0) {
    const recent = sameFestival.some((w) => ageDays(w.createdAt, now) < 420);
    return { value: recent ? 1 : 0.7, same: true, family: false };
  }
  const group = (type: string) => HOLIDAYS.find((h) => h.id === type)?.group;
  const sameGroup = wishes.filter((w) => group(w.templateType) === holiday.group).length;
  if (sameGroup > 0) return { value: 0.55, same: false, family: true };
  return { value: wishes.length > 0 ? 0.15 : 0, same: false, family: false };
}

function scoreOne(occurrence: HolidayOccurrence, input: CoachInput): Opportunity {
  const { holiday, date, daysUntil } = occurrence;
  const regionTable = REGION_WEIGHT[input.region ?? 'unknown'];
  const regionWeight = regionTable[holiday.group];
  const reach = (holiday.featured ? 0.85 : 0.4) * regionWeight;

  const aff = affinity(holiday, input.wishes, input.now);
  const { suggested, alreadyWished } = suggestRecipients(holiday, date, input.people, input.wishes, input.now);
  const specific = SPECIFIC_FIT[holiday.id as HolidayId];
  const fitCount = suggested.filter((s) => (specific ? specific.includes(s.person.relationship ?? '') : true)).length;
  const value = clamp01(1 - 0.65 ** (fitCount + (specific ? 0 : suggested.length * 0.25)));

  // Everyone who fits already had a wish this time: the work is done, so it stops pushing.
  const done = alreadyWished.length > 0 && suggested.length === 0 && input.people.length > 0;
  const freshness = done ? 0.25 : 1;

  // Where someone lives is only a guess. It counts for something until they have shown what they keep
  // (a festival sent before, its kind, or people in the Vault it is meant for), and then not at all.
  const evidence = aff.same || aff.family || fitCount > 0;
  const regionFactor = evidence ? 1 : 0.4 + 0.6 * regionWeight;

  const raw = 0.34 * timingWeight(daysUntil) + 0.22 * reach + 0.2 * aff.value + 0.24 * value;
  const score = Math.round(100 * clamp01(raw) * freshness * regionFactor);

  const reasons: Reason[] = [];
  if (daysUntil === 0) reasons.push('today');
  else if (daysUntil > 0 && daysUntil <= 7) reasons.push('soon');
  if (aff.same) reasons.push('wished_before');
  else if (aff.family) reasons.push('same_family');
  if (suggested.length > 0) reasons.push('people_fit');
  if (reach >= 0.7) reasons.push('popular_here');

  return { ...occurrence, score, reasons, suggested, alreadyWished };
}

/** Festivals worth showing now, best first. Anything snoozed this year is left out. */
export function planOpportunities(input: CoachInput): Opportunity[] {
  const found: Opportunity[] = [];
  for (const holiday of HOLIDAYS) {
    const next = nextOccurrence(holiday, input.now, COACH_GRACE_DAYS);
    if (!next || next.daysUntil > COACH_WINDOW_DAYS) continue;
    if (input.state.snoozed[`${holiday.id}:${next.date.year}`]) continue;
    const opportunity = scoreOne(next, input);
    if (opportunity.score >= MIN_SHOWN_SCORE) found.push(opportunity);
  }
  return found.sort((a, b) => b.score - a.score || a.daysUntil - b.daysUntil || a.holiday.label.localeCompare(b.holiday.label));
}

/* ------------------------------------------------------------------ when to say something */

export type Nudge = {
  opportunity: Opportunity;
  title: string;
  body: string;
  actionLabel: string;
};

const keyFor = (opportunity: Opportunity) => `${opportunity.holiday.id}:${opportunity.date.year}`;

/** "Priya", "Priya and Mom", "Priya, Mom and 2 more". */
export function namesLine(names: readonly string[]): string {
  const first = names.map((n) => n.trim().split(/\s+/)[0] ?? n).filter(Boolean);
  if (first.length === 0) return '';
  if (first.length === 1) return first[0]!;
  if (first.length === 2) return `${first[0]} and ${first[1]}`;
  return `${first[0]}, ${first[1]} and ${first.length - 2} more`;
}

/** "Diwali is in 3 days", "Diwali is today": how a festival's nearness is said. */
export function dayTitle(label: string, daysUntil: number): string {
  if (daysUntil === 0) return `${label} is today`;
  if (daysUntil === 1) return `${label} is tomorrow`;
  if (daysUntil < 0) return `${label} was yesterday`;
  return `${label} is in ${daysUntil} days`;
}

function nudgeCopy(opportunity: Opportunity): Pick<Nudge, 'title' | 'body' | 'actionLabel'> {
  const { holiday, daysUntil, suggested } = opportunity;
  const title = dayTitle(holiday.label, daysUntil);
  const people = namesLine(suggested.map((s) => s.person.name));
  const body = people
    ? `${people} ${suggested.length === 1 ? 'is' : 'are'} in your Vault. A photo and a few words is enough.`
    : 'A photo and a few honest words beat a forwarded message.';
  const first = suggested[0]?.person.name.trim().split(/\s+/)[0];
  return { title, body, actionLabel: first ? `Make a ${holiday.label} wish for ${first}` : `Make a ${holiday.label} wish` };
}

const sameDay = (iso: string | null, now: Date): boolean => iso !== null && new Date(iso).toDateString() === now.toDateString();

/** Whether the nudge for this festival is the one already showing today. */
const isContinuing = (opportunity: Opportunity, state: CoachState, now: Date): boolean =>
  state.lastNudgeKey === keyFor(opportunity) && sameDay(state.lastNudgeAt, now);

/**
 * The one nudge worth showing now, or null. A nudge needs a festival that is close and a reason that is strong,
 * is shown at most twice per festival and not more often than every 36 hours, and is quieter still when the person
 * has no wish left to spend. A nudge that appeared today stays for the rest of the day (it is one showing, not many);
 * snoozing a festival silences it for the year.
 */
export function chooseNudge(opportunities: readonly Opportunity[], state: CoachState, now: Date, wishesReady: number | null): Nudge | null {
  const noWishes = wishesReady === 0;
  const eligible = (o: Opportunity, ignoreCount: boolean): boolean => {
    if (o.daysUntil < -COACH_GRACE_DAYS || o.daysUntil > NUDGE_WITHIN_DAYS) return false;
    // "Everyone in the Vault fits" is true of every festival, so it is not a reason to speak on its own: the
    // festival must be a widely kept one, or one this person has shown they keep.
    if (!o.holiday.featured && !o.reasons.includes('wished_before') && !o.reasons.includes('same_family')) return false;
    if (o.score < (noWishes ? NUDGE_MIN_SCORE_NO_WISHES : NUDGE_MIN_SCORE)) return false;
    return ignoreCount || (state.shown[keyFor(o)]?.count ?? 0) < (noWishes ? 1 : NUDGE_MAX_PER_FESTIVAL);
  };

  const today = state.lastNudgeKey && sameDay(state.lastNudgeAt, now) ? state.lastNudgeKey : null;
  if (today) {
    // Today's nudge carries on, or stops if it no longer applies. No second festival is picked the same day.
    const current = opportunities.find((o) => keyFor(o) === today && eligible(o, true));
    return current ? { opportunity: current, ...nudgeCopy(current) } : null;
  }
  if (state.lastNudgeAt && now.getTime() - Date.parse(state.lastNudgeAt) < NUDGE_MIN_GAP_HOURS * 60 * 60 * 1000) return null;
  const best = opportunities.find((o) => eligible(o, false));
  return best ? { opportunity: best, ...nudgeCopy(best) } : null;
}

/** The state after a nudge was shown. Showing the same nudge again the same day changes nothing. */
export function markShown(state: CoachState, opportunity: Opportunity, now: Date): CoachState {
  if (isContinuing(opportunity, state, now)) return state;
  const key = keyFor(opportunity);
  return {
    ...state,
    lastNudgeAt: now.toISOString(),
    lastNudgeKey: key,
    shown: { ...state.shown, [key]: { count: (state.shown[key]?.count ?? 0) + 1, lastAt: now.toISOString() } },
  };
}

/** The state after "Not now": this festival stays quiet for the rest of the year. */
export function snooze(state: CoachState, opportunity: Opportunity, now: Date): CoachState {
  return { ...state, snoozed: { ...state.snoozed, [keyFor(opportunity)]: now.toISOString() } };
}

/**
 * When a reminder would go out if reminders were on: three days before and on the day, at a civil hour.
 * Nothing sends these today; it is the plan a server job would follow, with no reminder in the night.
 */
export const REMINDER_DAYS_BEFORE = [3, 0] as const;
export const REMINDER_HOURS = { before: 10, onTheDay: 9 } as const;

export function reminderTimes(opportunity: Opportunity, now: Date): Date[] {
  return REMINDER_DAYS_BEFORE.map((daysBefore) => {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + opportunity.daysUntil - daysBefore);
    day.setHours(daysBefore === 0 ? REMINDER_HOURS.onTheDay : REMINDER_HOURS.before, 0, 0, 0);
    return day;
  }).filter((time) => time.getTime() > now.getTime());
}
