import { PRO_YEARLY_CARD_LIMIT } from '../../billing/domain/wishBalance';
import { dayTitle, namesLine, type CoachState, type Opportunity } from './festivalCoach';

/**
 * What Home shows, to whom, and when it asks for a sale.
 *
 * Home used to show everyone the same stack: someone opening the app for the first time saw a badge journey with
 * nothing in it, a wish balance and an empty Vault section. That is noise, and noise is what makes an app feel like
 * work. This puts people in a stage (new, getting started, regular, away for a while), shows each stage only what
 * helps it, and puts the thing they most likely came to do first.
 *
 * Selling follows the same rule. A plan is offered once, to someone who has run out of wishes and has a real reason
 * to want more (a festival days away and people in their Vault it is for, or a birthday this week), in plain words,
 * and never twice in three days. Nothing here invents urgency, counts streaks to guilt anyone, or hides the free path.
 */

export type Stage = 'new_guest' | 'new_member' | 'starting' | 'regular' | 'lapsed';

/** The blocks under the greeting. The greeting itself is always first. */
export type HomeBlock =
  | 'nudge'
  | 'plan_prompt'
  | 'festivals'
  | 'who'
  | 'create_pill'
  | 'balance'
  | 'journey'
  | 'upcoming'
  | 'vault_nudge';

export type HomeSignals = {
  signedIn: boolean;
  /** Cards made, from the history. */
  cardsMade: number;
  daysSinceLastCard: number | null;
  peopleSaved: number;
  /** Birthdays in the Vault within the next two weeks. */
  birthdaysSoon: number;
  /** How many wishes can be made now; null when not known. */
  wishesReady: number | null;
  isPro: boolean;
};

/** Away this long, the app stops talking about progress and just offers the way back in. */
export const LAPSED_AFTER_DAYS = 60;
/** At or under this many wishes left, the balance is worth a place on Home. */
export const LOW_WISHES = 3;

export function stageOf(signals: HomeSignals): Stage {
  if (signals.cardsMade === 0) return signals.signedIn ? 'new_member' : 'new_guest';
  if (signals.daysSinceLastCard !== null && signals.daysSinceLastCard > LAPSED_AFTER_DAYS) return 'lapsed';
  return signals.cardsMade <= 2 ? 'starting' : 'regular';
}

/**
 * The blocks to show, in order. `nudge` and `plan_prompt` are included only when there is one to show. A plan prompt
 * replaces the nudge and the balance card (it already names the festival and the people, and says what the balance
 * card would), so Home never says two things at once.
 */
export function planHome(signals: HomeSignals, show: { nudge: boolean; prompt: boolean }): HomeBlock[] {
  const blocks = blocksFor(signals, show);
  // The balance card at zero already says "See plans", so beside a prompt that says it better (it names the festival
  // and the people) there would be two sales cards on one screen.
  return show.prompt ? blocks.filter((b) => b !== 'balance') : blocks;
}

function blocksFor(signals: HomeSignals, show: { nudge: boolean; prompt: boolean }): HomeBlock[] {
  const stage = stageOf(signals);
  const lowOnWishes = signals.isPro || (signals.wishesReady !== null && signals.wishesReady <= LOW_WISHES);
  const dates: HomeBlock[] =
    signals.birthdaysSoon > 0 ? ['upcoming'] : signals.peopleSaved === 0 ? ['vault_nudge'] : [];
  const top: HomeBlock[] = show.prompt ? ['plan_prompt'] : show.nudge ? ['nudge'] : [];

  switch (stage) {
    // Nothing made yet: the way in, and nothing else. No journey, no balance, no empty Vault section.
    case 'new_guest':
      return ['festivals', 'who', 'create_pill'];
    case 'new_member':
      return ['festivals', 'who', 'create_pill', ...(signals.wishesReady !== null ? (['balance'] as const) : [])];
    // A first card or two: show the progress that is just starting, and the Vault.
    case 'starting':
      return [...top, 'festivals', 'who', 'create_pill', 'balance', 'journey', ...dates];
    // Someone who knows what they want: the quick wish first, the balance only when it matters.
    case 'regular':
      return [...top, 'create_pill', 'festivals', 'who', ...(lowOnWishes ? (['balance'] as const) : []), ...dates, 'journey'];
    // Away a while: the way back in, with no progress to feel behind on.
    case 'lapsed':
      return [...top, 'festivals', 'create_pill', 'who', ...(signals.birthdaysSoon > 0 ? (['upcoming'] as const) : []), ...(lowOnWishes ? (['balance'] as const) : [])];
  }
}

/* ------------------------------------------------------------------ the plan prompt */

export type PlanPrompt = {
  /** Identifies the reason, so the same one is not shown twice: "plan:diwali:2026". */
  key: string;
  kind: 'festival' | 'birthday';
  holidayId: string | null;
  title: string;
  body: string;
  actionLabel: string;
};

export type PromptInput = {
  isPro: boolean;
  signedIn: boolean;
  wishesReady: number | null;
  opportunities: readonly Opportunity[];
  birthdays: ReadonlyArray<{ id: string; name: string; daysUntil: number }>;
  state: CoachState;
  now: Date;
};

/** How close the reason must be, and how long a prompt that was put away stays quiet or one that was shown rests. */
export const PROMPT_FESTIVAL_WITHIN_DAYS = 14;
export const PROMPT_BIRTHDAY_WITHIN_DAYS = 7;
export const PROMPT_REST_DAYS = 7;
export const PROMPT_MIN_GAP_DAYS = 3;

const DAY_MS = 24 * 60 * 60 * 1000;
const sameDay = (iso: string | undefined | null, now: Date) => !!iso && new Date(iso).toDateString() === now.toDateString();
const within = (iso: string | undefined, days: number, now: Date) => !!iso && now.getTime() - Date.parse(iso) < days * DAY_MS;

function allowed(key: string, state: CoachState, now: Date): boolean {
  if (within(state.dismissedPrompts[key], PROMPT_REST_DAYS, now)) return false;
  const shown = state.prompts[key];
  if (shown && sameDay(shown, now)) return true; // already showing today: it carries on
  if (within(shown, PROMPT_REST_DAYS, now)) return false;
  return !within(state.lastPromptAt ?? undefined, PROMPT_MIN_GAP_DAYS, now);
}

const first = (name: string) => name.trim().split(/\s+/)[0] ?? name;

/** What a plan is, in the same breath as what the free path is. Home and the share screen say it the same way. */
export function wishesUsedBody(names: readonly string[]): string {
  const pro = `Occasio Pro for ${PRO_YEARLY_CARD_LIMIT} cards a year`;
  if (names.length === 1) {
    const one = first(names[0]!);
    return `${one} is in your Vault and your wishes are used. One wish is enough for ${one}, or ${pro}.`;
  }
  return `${namesLine(names)} are in your Vault and your wishes are used. One wish for each, or ${pro}.`;
}

/**
 * A plan, offered at a moment of real need and not otherwise: the person is signed in, is not on Pro, has no wish
 * left, and there is something they would obviously spend one on. The words say what is on offer and nothing more.
 */
export function choosePlanPrompt(input: PromptInput): PlanPrompt | null {
  const { isPro, signedIn, wishesReady, opportunities, birthdays, state, now } = input;
  if (isPro || !signedIn || wishesReady !== 0) return null;
  const pro = `Occasio Pro for ${PRO_YEARLY_CARD_LIMIT} cards a year`;

  const festival = opportunities.find(
    (o) =>
      o.daysUntil >= 0 &&
      o.daysUntil <= PROMPT_FESTIVAL_WITHIN_DAYS &&
      o.suggested.length > 0 &&
      (o.holiday.featured || o.reasons.includes('wished_before') || o.reasons.includes('same_family')) &&
      allowed(`plan:${o.holiday.id}:${o.date.year}`, state, now),
  );
  if (festival) {
    return {
      key: `plan:${festival.holiday.id}:${festival.date.year}`,
      kind: 'festival',
      holidayId: festival.holiday.id,
      title: dayTitle(festival.holiday.label, festival.daysUntil),
      body: wishesUsedBody(festival.suggested.map((s) => s.person.name)),
      actionLabel: 'See plans',
    };
  }

  const birthday = [...birthdays]
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .find((b) => b.daysUntil >= 0 && b.daysUntil <= PROMPT_BIRTHDAY_WITHIN_DAYS && allowed(`plan:birthday:${b.id}:${now.getFullYear()}`, state, now));
  if (birthday) {
    const name = first(birthday.name);
    const when = birthday.daysUntil === 0 ? 'today' : birthday.daysUntil === 1 ? 'tomorrow' : `in ${birthday.daysUntil} days`;
    return {
      key: `plan:birthday:${birthday.id}:${now.getFullYear()}`,
      kind: 'birthday',
      holidayId: null,
      title: `${name}'s birthday is ${when}`,
      body: `Your wishes are used. One wish is enough for ${name}, or ${pro}.`,
      actionLabel: 'See plans',
    };
  }
  return null;
}

/** The state after a prompt appeared. Showing the same one again today changes nothing. */
export function markPromptShown(state: CoachState, prompt: PlanPrompt, now: Date): CoachState {
  if (sameDay(state.prompts[prompt.key], now)) return state;
  return { ...state, prompts: { ...state.prompts, [prompt.key]: now.toISOString() }, lastPromptAt: now.toISOString() };
}

/** The state after "Not now": this reason stays quiet for a week. */
export function dismissPrompt(state: CoachState, prompt: PlanPrompt, now: Date): CoachState {
  return { ...state, dismissedPrompts: { ...state.dismissedPrompts, [prompt.key]: now.toISOString() } };
}
