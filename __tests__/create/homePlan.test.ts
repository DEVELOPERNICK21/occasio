import { EMPTY_COACH_STATE, planOpportunities, type CoachWish } from '../../src/features/create/domain/festivalCoach';
import {
  LAPSED_AFTER_DAYS,
  choosePlanPrompt,
  dismissPrompt,
  markPromptShown,
  planHome,
  stageOf,
  wishesUsedBody,
  type HomeSignals,
} from '../../src/features/create/domain/homePlan';

const at = (y: number, m: number, d: number, h = 10) => new Date(y, m - 1, d, h, 0, 0);
const signals = (over: Partial<HomeSignals> = {}): HomeSignals => ({
  signedIn: true,
  cardsMade: 5,
  daysSinceLastCard: 10,
  peopleSaved: 2,
  birthdaysSoon: 0,
  wishesReady: 2,
  isPro: false,
  ...over,
});
const none = { nudge: false, prompt: false };

describe('who is looking at Home', () => {
  it('tells a first visit from a first card from a habit from time away', () => {
    expect(stageOf(signals({ signedIn: false, cardsMade: 0, daysSinceLastCard: null }))).toBe('new_guest');
    expect(stageOf(signals({ cardsMade: 0, daysSinceLastCard: null }))).toBe('new_member');
    expect(stageOf(signals({ cardsMade: 1 }))).toBe('starting');
    expect(stageOf(signals({ cardsMade: 2 }))).toBe('starting');
    expect(stageOf(signals({ cardsMade: 3 }))).toBe('regular');
    expect(stageOf(signals({ cardsMade: 9, daysSinceLastCard: LAPSED_AFTER_DAYS }))).toBe('regular');
    expect(stageOf(signals({ cardsMade: 9, daysSinceLastCard: LAPSED_AFTER_DAYS + 1 }))).toBe('lapsed');
    // Nobody who has made nothing can be "away".
    expect(stageOf(signals({ cardsMade: 0, daysSinceLastCard: 400 }))).toBe('new_member');
  });
});

describe('what each stage is shown', () => {
  it('shows a first visit the way in and nothing else: no journey, balance, Vault or plans', () => {
    const plan = planHome(signals({ signedIn: false, cardsMade: 0, daysSinceLastCard: null, wishesReady: null, peopleSaved: 0 }), { nudge: true, prompt: true });
    expect(plan).toEqual(['festivals', 'who', 'create_pill']);
  });

  it('shows someone signed in with no card yet their free wish, and still no journey', () => {
    expect(planHome(signals({ cardsMade: 0, daysSinceLastCard: null, wishesReady: 1 }), none)).toEqual(['festivals', 'who', 'create_pill', 'balance']);
    expect(planHome(signals({ cardsMade: 0, daysSinceLastCard: null, wishesReady: null }), none)).toEqual(['festivals', 'who', 'create_pill']);
  });

  it('shows someone with a card or two the progress that is just starting, and the Vault', () => {
    const plan = planHome(signals({ cardsMade: 1, peopleSaved: 0 }), none);
    expect(plan).toEqual(['festivals', 'who', 'create_pill', 'balance', 'journey', 'vault_nudge']);
    expect(planHome(signals({ cardsMade: 2, birthdaysSoon: 1 }), none)).toContain('upcoming');
    // People saved but no birthday near: neither section, instead of an empty one.
    const quiet = planHome(signals({ cardsMade: 2, peopleSaved: 3, birthdaysSoon: 0 }), none);
    expect(quiet).not.toContain('upcoming');
    expect(quiet).not.toContain('vault_nudge');
  });

  it('leaves the balance card out beside a plan prompt, so there is one sale on the page and not two', () => {
    const regular = signals({ wishesReady: 0 });
    expect(planHome(regular, { nudge: false, prompt: false })).toContain('balance');
    const withPrompt = planHome(regular, { nudge: false, prompt: true });
    expect(withPrompt).toContain('plan_prompt');
    expect(withPrompt).not.toContain('balance');
    // the way to make a card is still there
    expect(withPrompt).toEqual(expect.arrayContaining(['create_pill', 'festivals', 'who']));
    for (const cards of [0, 1, 2, 5]) {
      expect(planHome(signals({ cardsMade: cards, daysSinceLastCard: cards ? 10 : null, wishesReady: 0 }), { nudge: false, prompt: true })).not.toContain('balance');
    }
  });

  it('puts the quick wish first for someone who knows what they want, and the balance only when it matters', () => {
    const plenty = planHome(signals({ wishesReady: 12 }), none);
    expect(plenty.slice(0, 3)).toEqual(['create_pill', 'festivals', 'who']);
    expect(plenty).not.toContain('balance');
    expect(planHome(signals({ wishesReady: 3 }), none)).toContain('balance');
    expect(planHome(signals({ wishesReady: 0 }), none)).toContain('balance');
    expect(planHome(signals({ wishesReady: 40, isPro: true }), none)).toContain('balance');
    expect(plenty[plenty.length - 1]).toBe('journey');
  });

  it('welcomes someone back without progress to feel behind on', () => {
    const plan = planHome(signals({ cardsMade: 8, daysSinceLastCard: 120, birthdaysSoon: 1, wishesReady: 1 }), none);
    expect(plan).toEqual(['festivals', 'create_pill', 'who', 'upcoming', 'balance']);
    expect(plan).not.toContain('journey');
    expect(plan).not.toContain('vault_nudge');
  });

  it('puts the nudge or the plan prompt first, and never both: a prompt already names the festival', () => {
    expect(planHome(signals(), { nudge: true, prompt: false })[0]).toBe('nudge');
    expect(planHome(signals(), { nudge: false, prompt: true })[0]).toBe('plan_prompt');
    const both = planHome(signals(), { nudge: true, prompt: true });
    expect(both[0]).toBe('plan_prompt');
    expect(both).not.toContain('nudge');
  });

  it('never shows a block twice', () => {
    for (const cardsMade of [0, 1, 4, 9]) {
      for (const daysSinceLastCard of [3, 90]) {
        const plan = planHome(signals({ cardsMade, daysSinceLastCard, birthdaysSoon: 1 }), { nudge: true, prompt: false });
        expect(new Set(plan).size).toBe(plan.length);
      }
    }
  });
});

describe('asking for a sale', () => {
  const now = at(2026, 11, 6);
  const wishes: CoachWish[] = [
    { recipientName: 'Priya', templateType: 'diwali', createdAt: at(2025, 10, 19).toISOString() },
    { recipientName: 'Mom', templateType: 'diwali', createdAt: at(2025, 10, 19).toISOString() },
  ];
  const people = [
    { id: 'm', name: 'Mom', relationship: 'mom' },
    { id: 'p', name: 'Priya Sharma', relationship: 'friend' },
  ];
  const opportunities = planOpportunities({ now, region: 'IN', people, wishes, wishesReady: 0, state: EMPTY_COACH_STATE });
  const base = { isPro: false, signedIn: true, wishesReady: 0 as number | null, opportunities, birthdays: [], state: EMPTY_COACH_STATE, now };

  it('says it for one person without "each", and for several with who they are', () => {
    expect(wishesUsedBody(['Priya Sharma'])).toBe(
      'Priya is in your Vault and your wishes are used. One wish is enough for Priya, or Occasio Pro for 24 cards a year.',
    );
    expect(wishesUsedBody(['Mom', 'Priya Sharma', 'Dad', 'Sam'])).toBe(
      'Mom, Priya and 2 more are in your Vault and your wishes are used. One wish for each, or Occasio Pro for 24 cards a year.',
    );
  });

  it('offers a plan to someone out of wishes with a festival two days away and people in the Vault, in plain words', () => {
    const prompt = choosePlanPrompt(base)!;
    expect(prompt.key).toBe('plan:diwali:2026');
    expect(prompt.title).toBe('Diwali is in 2 days');
    expect(prompt.body).toBe('Mom and Priya are in your Vault and your wishes are used. One wish for each, or Occasio Pro for 24 cards a year.');
    expect(prompt.actionLabel).toBe('See plans');
    for (const text of [prompt.title, prompt.body, prompt.actionLabel]) {
      expect(text).not.toContain('!');
      expect(text).not.toMatch(/\p{Extended_Pictographic}/u);
      expect(text).not.toMatch(/last chance|hurry|only today|limited|don.?t miss|\bsave\b|%/i);
    }
  });

  it('never asks Pro members, guests, anyone with a wish left, or when it is not known', () => {
    expect(choosePlanPrompt({ ...base, isPro: true })).toBeNull();
    expect(choosePlanPrompt({ ...base, signedIn: false })).toBeNull();
    expect(choosePlanPrompt({ ...base, wishesReady: 1 })).toBeNull();
    expect(choosePlanPrompt({ ...base, wishesReady: null })).toBeNull();
  });

  it('needs a reason: no people it is for, or a festival too far off, is not enough', () => {
    const lonely = planOpportunities({ now, region: 'IN', people: [], wishes, wishesReady: 0, state: EMPTY_COACH_STATE });
    expect(choosePlanPrompt({ ...base, opportunities: lonely })).toBeNull();
    // Early July: no widely kept festival within two weeks, so there is nothing to spend a wish on yet.
    const july = at(2026, 7, 1);
    const far = planOpportunities({ now: july, region: 'IN', people, wishes, wishesReady: 0, state: EMPTY_COACH_STATE });
    expect(choosePlanPrompt({ ...base, now: july, opportunities: far })).toBeNull();
  });

  it('falls back to a birthday this week, and not one further off', () => {
    const none: typeof base.opportunities = [];
    const soon = choosePlanPrompt({ ...base, opportunities: none, birthdays: [{ id: 'x', name: 'Sam Rao', daysUntil: 3 }] })!;
    expect(soon.key).toBe('plan:birthday:x:2026');
    expect(soon.title).toBe("Sam's birthday is in 3 days");
    expect(soon.body).toBe('Your wishes are used. One wish is enough for Sam, or Occasio Pro for 24 cards a year.');
    expect(choosePlanPrompt({ ...base, opportunities: none, birthdays: [{ id: 'x', name: 'Sam', daysUntil: 9 }] })).toBeNull();
    expect(choosePlanPrompt({ ...base, opportunities: none, birthdays: [{ id: 'x', name: 'Sam', daysUntil: 0 }] })!.title).toBe("Sam's birthday is today");
  });

  it('shows once, carries on through that day, and rests a week', () => {
    const prompt = choosePlanPrompt(base)!;
    const shown = markPromptShown(EMPTY_COACH_STATE, prompt, now);
    expect(markPromptShown(shown, prompt, at(2026, 11, 6, 20))).toBe(shown);
    expect(choosePlanPrompt({ ...base, state: shown, now: at(2026, 11, 6, 20) })?.key).toBe('plan:diwali:2026');
    expect(choosePlanPrompt({ ...base, state: shown, now: at(2026, 11, 7) })).toBeNull();
  });

  it('puts a reason away for a week when the person says not now, and brings nothing else within three days', () => {
    const prompt = choosePlanPrompt(base)!;
    const dismissed = dismissPrompt(markPromptShown(EMPTY_COACH_STATE, prompt, now), prompt, now);
    expect(choosePlanPrompt({ ...base, state: dismissed, now: at(2026, 11, 6, 18) })).toBeNull();
    const birthdayLater = choosePlanPrompt({ ...base, opportunities: [], birthdays: [{ id: 'x', name: 'Sam', daysUntil: 2 }], state: dismissed, now: at(2026, 11, 8) });
    expect(birthdayLater).toBeNull();
    const afterThreeDays = choosePlanPrompt({ ...base, opportunities: [], birthdays: [{ id: 'x', name: 'Sam', daysUntil: 2 }], state: dismissed, now: at(2026, 11, 10) });
    expect(afterThreeDays?.key).toBe('plan:birthday:x:2026');
  });
});
