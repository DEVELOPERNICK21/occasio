import {
  COACH_WINDOW_DAYS,
  EMPTY_COACH_STATE,
  MIN_SHOWN_SCORE,
  audienceForRelationship,
  chooseNudge,
  markShown,
  namesLine,
  planOpportunities,
  regionFromLocale,
  reminderTimes,
  snooze,
  suggestRecipients,
  timingWeight,
  type CoachInput,
  type CoachPerson,
  type CoachWish,
} from '../../src/features/create/domain/festivalCoach';
import { holidayById, nextOccurrence } from '../../src/features/create/domain/holidays';

const at = (y: number, m: number, d: number, h = 10) => new Date(y, m - 1, d, h, 0, 0);
const day = (y: number, m: number, d: number) => ({ year: y, month: m, day: d });
const h = (id: string) => holidayById(id)!;

const priya: CoachPerson = { id: 'p', name: 'Priya Sharma', relationship: 'friend' };
const mom: CoachPerson = { id: 'm', name: 'Mom', relationship: 'mom' };
const dad: CoachPerson = { id: 'd', name: 'Dad', relationship: 'dad' };
const sam: CoachPerson = { id: 's', name: 'Sam', relationship: 'sibling' };

const wish = (recipientName: string, templateType: string, when: Date): CoachWish => ({
  recipientName,
  templateType,
  createdAt: when.toISOString(),
});

const input = (over: Partial<CoachInput> = {}): CoachInput => ({
  now: at(2026, 11, 9),
  region: 'IN',
  people: [],
  wishes: [],
  wishesReady: 1,
  state: EMPTY_COACH_STATE,
  ...over,
});

const ids = (list: Array<{ holiday: { id: string } }>) => list.map((o) => o.holiday.id);

describe('how near counts', () => {
  it('pulls hardest on the day and fades over two months, never going up', () => {
    const weights = [-1, 0, 1, 3, 7, 14, 30, 60].map(timingWeight);
    expect(weights[1]).toBe(1);
    expect(weights[0]).toBeLessThan(weights[1]!);
    for (let i = 2; i < weights.length; i += 1) expect(weights[i]).toBeLessThan(weights[i - 1]!);
  });
});

describe('where someone is', () => {
  it('reads the country from a device locale, and says nothing when it does not say', () => {
    expect(regionFromLocale('en-IN')).toBe('IN');
    expect(regionFromLocale('hi_IN')).toBe('IN');
    expect(regionFromLocale('en-US')).toBe('US');
    expect(regionFromLocale('en-GB')).toBe('other');
    expect(regionFromLocale('en')).toBeNull();
    expect(regionFromLocale(undefined)).toBeNull();
  });
});

describe('ranking the festivals', () => {
  it('puts the nearest festival people keep where they live first, with nothing known about them', () => {
    const top = planOpportunities(input());
    expect(top[0]?.holiday.id).toBe('bhai_dooj');
    expect(ids(top)).toEqual(expect.arrayContaining(['diwali', 'guru_nanak_jayanti']));
    expect(top.every((o) => o.score >= MIN_SHOWN_SCORE && o.daysUntil <= COACH_WINDOW_DAYS)).toBe(true);
    expect(top.map((o) => o.score)).toEqual([...top.map((o) => o.score)].sort((a, b) => b - a));
  });

  it('weighs where someone lives as a guess: a US phone is not led by an Indian festival', () => {
    const india = planOpportunities(input({ region: 'IN' })).find((o) => o.holiday.id === 'bhai_dooj')!;
    const us = planOpportunities(input({ region: 'US' }));
    expect(us.find((o) => o.holiday.id === 'bhai_dooj')?.score ?? 0).toBeLessThan(india.score);
    expect(ids(us)).toContain('thanksgiving');
    expect(ids(planOpportunities(input({ region: 'IN' })))).not.toContain('thanksgiving');
  });

  it('stops counting the guess once someone has shown what they keep', () => {
    // A US phone, but Diwali was wished to two people last year: Diwali outranks the local default.
    const wishes = [wish('Priya', 'diwali', at(2025, 10, 19)), wish('Mom', 'diwali', at(2025, 10, 19))];
    const now = at(2026, 11, 6);
    const base = planOpportunities(input({ now, region: 'US' }));
    const learned = planOpportunities(input({ now, region: 'US', wishes, people: [priya, mom, dad] }));
    const score = (list: typeof base) => list.find((o) => o.holiday.id === 'diwali')?.score ?? 0;
    expect(score(learned)).toBeGreaterThan(score(base) + 30);
    expect(learned[0]?.holiday.id).toBe('diwali');
    expect(learned[0]?.reasons).toEqual(expect.arrayContaining(['wished_before', 'people_fit', 'soon']));
  });

  it('leaves out a festival that was snoozed for the year, and brings it back next year', () => {
    const open = planOpportunities(input());
    const bhai = open.find((o) => o.holiday.id === 'bhai_dooj')!;
    const state = snooze(EMPTY_COACH_STATE, bhai, at(2026, 11, 9));
    expect(ids(planOpportunities(input({ state })))).not.toContain('bhai_dooj');
    const nextYear = planOpportunities(input({ state, now: at(2027, 10, 28) }));
    expect(ids(nextYear)).toContain('bhai_dooj');
  });

  it('stops pushing a festival once everyone it is for has had a wish', () => {
    const now = at(2026, 11, 7);
    const before = planOpportunities(input({ now, people: [priya] })).find((o) => o.holiday.id === 'diwali')!;
    const done = planOpportunities(input({ now, people: [priya], wishes: [wish('Priya Sharma', 'diwali', at(2026, 11, 6))] }));
    expect(before.suggested.map((s) => s.person.name)).toEqual(['Priya Sharma']);
    // The festival drops out of the list rather than asking again.
    expect(ids(done)).not.toContain('diwali');
  });
});

describe('who to wish', () => {
  const diwali = h('diwali');
  const date = day(2026, 11, 8);
  const now = at(2026, 11, 6);

  it('starts with whom the festival was wished to last year, then whoever has gone longest without a card', () => {
    const wishes = [wish('Priya', 'diwali', at(2025, 10, 19)), wish('Mom', 'diwali', at(2025, 10, 19)), wish('Sam', 'birthday', at(2026, 10, 30))];
    const { suggested } = suggestRecipients(diwali, date, [priya, mom, dad, sam], wishes, now);
    expect(suggested.map((s) => s.person.name)).toEqual(['Mom', 'Priya Sharma', 'Dad', 'Sam']);
    expect(suggested.map((s) => s.why)).toEqual(['wished_last_year', 'wished_last_year', 'catch_up', 'catch_up']);
  });

  it('recognises the same person by first name, and leaves out whoever already had one this time', () => {
    const wishes = [wish('priya', 'diwali', at(2026, 11, 5))];
    const { suggested, alreadyWished } = suggestRecipients(diwali, date, [priya, mom], wishes, now);
    expect(suggested.map((s) => s.person.name)).toEqual(['Mom']);
    expect(alreadyWished).toEqual(['Priya Sharma']);
  });

  it('offers a festival that is meant for one kind of person only to that kind', () => {
    const mothers = h('mothers_day');
    const { suggested } = suggestRecipients(mothers, day(2027, 5, 9), [priya, mom, dad], [], at(2027, 5, 5));
    expect(suggested.map((s) => s.person.name)).toEqual(['Mom']);
    expect(suggested[0]?.why).toBe('fits');
    expect(suggestRecipients(mothers, day(2027, 5, 9), [priya, dad], [], at(2027, 5, 5)).suggested).toEqual([]);
    expect(suggestRecipients(h('raksha_bandhan'), day(2026, 8, 28), [priya, sam], [], at(2026, 8, 20)).suggested.map((s) => s.person.name)).toEqual(['Sam']);
  });

  it('offers at most four, and nobody when the Vault is empty', () => {
    const many = Array.from({ length: 7 }, (_, i) => ({ id: `x${i}`, name: `Person ${i}`, relationship: 'friend' }));
    expect(suggestRecipients(diwali, date, many, [], now).suggested).toHaveLength(4);
    expect(suggestRecipients(diwali, date, [], [], now).suggested).toEqual([]);
  });

  it('turns a relationship into the audience a card starts with', () => {
    expect(audienceForRelationship('mom')).toBe('mom');
    expect(audienceForRelationship('sibling')).toBe('family');
    expect(audienceForRelationship('colleague')).toBe('someone_special');
    expect(audienceForRelationship(null)).toBe('someone_special');
  });
});

describe('when to say something', () => {
  const now = at(2026, 11, 6);
  const wishes = [wish('Priya', 'diwali', at(2025, 10, 19)), wish('Mom', 'diwali', at(2025, 10, 19))];
  const opportunities = planOpportunities(input({ now, wishes, people: [priya, mom, dad] }));

  it('nudges for a close festival with a strong reason, in plain words', () => {
    const nudge = chooseNudge(opportunities, EMPTY_COACH_STATE, now, 3)!;
    expect(nudge.opportunity.holiday.id).toBe('diwali');
    expect(nudge.title).toBe('Diwali is in 2 days');
    expect(nudge.body).toBe('Mom, Priya and 1 more are in your Vault. A photo and a few words is enough.');
    expect(nudge.actionLabel).toBe('Make a Diwali wish for Mom');
    for (const text of [nudge.title, nudge.body, nudge.actionLabel]) {
      expect(text).not.toContain('!');
      expect(text).not.toMatch(/\p{Extended_Pictographic}/u);
      expect(text).not.toMatch(/don.?t forget|last chance|hurry/i);
    }
  });

  it('says nothing for a festival that is not close, or whose reason is weak', () => {
    expect(chooseNudge(planOpportunities(input({ now: at(2026, 10, 1) })), EMPTY_COACH_STATE, at(2026, 10, 1), 3)).toBeNull();
    const weak = planOpportunities(input({ now: at(2026, 11, 9) }));
    expect(chooseNudge(weak, EMPTY_COACH_STATE, at(2026, 11, 9), 3)).toBeNull();
  });

  it('keeps today\u2019s nudge through the day as one showing, then rests for a day and a half', () => {
    const state = markShown(EMPTY_COACH_STATE, opportunities[0]!, now);
    // Opening Home again the same day still shows it, and does not count as another showing.
    const sameDayLater = new Date(now.getTime() + 2 * 3600_000);
    expect(chooseNudge(opportunities, state, sameDayLater, 3)?.opportunity.holiday.id).toBe('diwali');
    expect(markShown(state, opportunities[0]!, sameDayLater)).toBe(state);
    expect(state.shown['diwali:2026']?.count).toBe(1);
    // The next day it is quiet (under 36 hours since it appeared)...
    expect(chooseNudge(opportunities, state, new Date(now.getTime() + 26 * 3600_000), 3)).toBeNull();
  });

  it('shows a festival at most twice', () => {
    let state = markShown(EMPTY_COACH_STATE, opportunities[0]!, now);
    const later = new Date(now.getTime() + 40 * 3600_000);
    expect(chooseNudge(opportunities, state, later, 3)?.opportunity.holiday.id).toBe('diwali');
    state = markShown(state, opportunities[0]!, later);
    expect(state.shown['diwali:2026']?.count).toBe(2);
    const muchLater = new Date(later.getTime() + 40 * 3600_000);
    // Diwali has had its two. Anything else must earn it.
    expect(chooseNudge(opportunities, state, muchLater, 3)?.opportunity.holiday.id).not.toBe('diwali');
  });

  it('does not speak for a minor festival just because everyone in the Vault fits it', () => {
    // Gujarati New Year is not widely kept and this person has never sent it: no nudge, though it is four days off.
    const nudge = chooseNudge(opportunities.filter((o) => o.holiday.id === 'gujarati_new_year'), EMPTY_COACH_STATE, now, 3);
    expect(nudge).toBeNull();
  });

  it('is quieter when there is no wish left to spend', () => {
    expect(chooseNudge(opportunities, EMPTY_COACH_STATE, now, 0)).not.toBeNull();
    const state = markShown(EMPTY_COACH_STATE, opportunities[0]!, now);
    const later = new Date(now.getTime() + 40 * 3600_000);
    // One showing is all it gets when there is nothing to spend; with wishes left it may come once more.
    expect(chooseNudge(opportunities, state, later, 0)).toBeNull();
    expect(chooseNudge(opportunities, state, later, 2)).not.toBeNull();
  });

  it('keeps a snoozed festival quiet and records what was shown', () => {
    const snoozed = snooze(EMPTY_COACH_STATE, opportunities[0]!, now);
    expect(snoozed.snoozed['diwali:2026']).toBe(now.toISOString());
    const shown = markShown(EMPTY_COACH_STATE, opportunities[0]!, now);
    expect(shown.shown['diwali:2026']).toEqual({ count: 1, lastAt: now.toISOString() });
    expect(shown.lastNudgeAt).toBe(now.toISOString());
    expect(shown.lastNudgeKey).toBe('diwali:2026');
  });

  it('names people the way a person would', () => {
    expect(namesLine([])).toBe('');
    expect(namesLine(['Priya Sharma'])).toBe('Priya');
    expect(namesLine(['Priya', 'Mom'])).toBe('Priya and Mom');
    expect(namesLine(['Priya', 'Mom', 'Dad', 'Sam'])).toBe('Priya, Mom and 2 more');
  });
});

describe('reminders, if they were on', () => {
  it('plans three days before and on the day, at civil hours, never in the past', () => {
    const now = at(2026, 11, 4, 8);
    const diwali = { ...nextOccurrence(h('diwali'), now)!, score: 90, reasons: [], suggested: [], alreadyWished: [] };
    const times = reminderTimes(diwali, now);
    expect(times.map((t) => [t.getMonth() + 1, t.getDate(), t.getHours()])).toEqual([[11, 5, 10], [11, 8, 9]]);
    const soon = reminderTimes({ ...diwali, daysUntil: 1 }, now);
    expect(soon.map((t) => [t.getDate(), t.getHours()])).toEqual([[5, 9]]);
    for (const t of [...times, ...soon]) expect(t.getHours()).toBeGreaterThanOrEqual(8);
  });
});
