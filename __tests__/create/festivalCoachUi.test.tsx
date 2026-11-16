import React from 'react';
import TestRenderer, { act, type ReactTestInstance } from 'react-test-renderer';

jest.mock('@react-native-async-storage/async-storage', () => {
  const store = new Map<string, string>();
  return {
    __esModule: true,
    default: {
      getItem: jest.fn(async (key: string) => store.get(key) ?? null),
      setItem: jest.fn(async (key: string, value: string) => {
        store.set(key, value);
      }),
      removeItem: jest.fn(async (key: string) => {
        store.delete(key);
      }),
      __store: store,
    },
  };
});
jest.mock('../../src/shared/analytics/events', () => ({
  ...jest.requireActual('../../src/shared/analytics/events'),
  trackEvent: jest.fn(),
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import { trackEvent } from '../../src/shared/analytics/events';
import { readCoachState, writeCoachState } from '../../src/features/create/data/festivalCoachStorage';
import { useFestivalCoach } from '../../src/features/create/application/useFestivalCoach';
import { FestivalNextPeople } from '../../src/features/create/ui/components/FestivalNextPeople';
import { ReminderCard } from '../../src/features/create/ui/components/ReminderCard';
import { FestivalOrnaments } from '../../src/features/create/ui/components/FestivalOrnaments';
import { UpcomingHolidays } from '../../src/features/create/ui/components/UpcomingHolidays';
import { EMPTY_COACH_STATE, chooseNudge, planOpportunities } from '../../src/features/create/domain/festivalCoach';
import { choosePlanPrompt } from '../../src/features/create/domain/homePlan';
import { comingUpHolidays, holidayById } from '../../src/features/create/domain/holidays';

const store = (AsyncStorage as unknown as { __store: Map<string, string> }).__store;
const now = new Date(2026, 10, 6, 10, 0, 0);
const people = [
  { id: 'm', personName: 'Mom', relationshipType: 'mom' },
  { id: 'p', personName: 'Priya Sharma', relationshipType: 'friend' },
];
const entries = [
  { recipientName: 'Mom', templateType: 'diwali', createdAt: new Date(2025, 9, 19).toISOString() },
  { recipientName: 'Priya', templateType: 'diwali', createdAt: new Date(2025, 9, 19).toISOString() },
];

const render = async (element: React.ReactElement) => {
  let renderer!: TestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = TestRenderer.create(element);
  });
  return renderer;
};
const textOf = (root: ReactTestInstance) =>
  root
    .findAll((n) => (n.type as unknown) === 'Text')
    .map((n) => n.children.join(''))
    .join('\n');
/** Taps what is labelled for a screen reader, or else the button whose text is this. */
const press = async (root: ReactTestInstance, label: string) => {
  let target: ReactTestInstance | null | undefined = root.findAll(
    (n) => n.props.accessibilityLabel?.startsWith?.(label) && typeof n.props.onPress === 'function',
  )[0];
  if (!target) {
    target = root.findAll((n) => n.props.children === label)[0] ?? null;
    while (target && typeof target.props.onPress !== 'function') target = target.parent;
  }
  expect(target).toBeTruthy();
  await act(async () => {
    target!.props.onPress();
  });
};

beforeEach(() => {
  store.clear();
  (trackEvent as jest.Mock).mockClear();
});

describe('what the coach remembers', () => {
  it('stores and reads back what was shown and snoozed, per account', async () => {
    const state = { ...EMPTY_COACH_STATE, snoozed: { 'diwali:2026': 'x' }, shown: { 'diwali:2026': { count: 1, lastAt: 'y' } }, lastNudgeAt: 'z', lastNudgeKey: 'diwali:2026' };
    await writeCoachState('u1', state);
    expect(await readCoachState('u1')).toEqual(state);
    expect(await readCoachState('u2')).toEqual(EMPTY_COACH_STATE);
  });

  it('keeps which plan prompts were shown and put away', async () => {
    const state = {
      ...EMPTY_COACH_STATE,
      prompts: { 'plan:diwali:2026': '2026-11-06T09:00:00.000Z' },
      dismissedPrompts: { 'plan:birthday:p:2026': '2026-11-01T09:00:00.000Z' },
      lastPromptAt: '2026-11-06T09:00:00.000Z',
    };
    await writeCoachState('u1', state);
    expect(await readCoachState('u1')).toEqual(state);
  });

  it('survives damaged storage instead of failing', async () => {
    store.set('occasio.festivalCoach.v1.u1', '{not json');
    expect(await readCoachState('u1')).toEqual(EMPTY_COACH_STATE);
    store.set('occasio.festivalCoach.v1.u1', JSON.stringify({ snoozed: { a: 1 }, shown: { b: { count: 'x' } }, lastNudgeAt: 5 }));
    expect(await readCoachState('u1')).toEqual(EMPTY_COACH_STATE);
  });
});

describe('the coach on the device', () => {
  async function mountHook(over: Partial<Parameters<typeof useFestivalCoach>[0]> = {}) {
    const seen: { current: ReturnType<typeof useFestivalCoach> | null } = { current: null };
    function Probe() {
      seen.current = useFestivalCoach({ uid: 'u1', now, people, entries, wishesReady: 3, enabled: true, region: 'IN', ...over });
      return null;
    }
    await act(async () => {
      TestRenderer.create(<Probe />);
    });
    await act(async () => undefined);
    return seen as { current: ReturnType<typeof useFestivalCoach> };
  }

  it('finds today’s nudge from the Vault and the history, and counts it as shown once', async () => {
    const hook = await mountHook();
    expect(hook.current.nudge?.opportunity.holiday.id).toBe('diwali');
    expect(hook.current.opportunities[0]?.suggested.map((s) => s.person.name)).toEqual(['Mom', 'Priya Sharma']);
    const saved = JSON.parse(store.get('occasio.festivalCoach.v1.u1')!);
    expect(saved.shown['diwali:2026'].count).toBe(1);
    expect(saved.lastNudgeKey).toBe('diwali:2026');
    expect((trackEvent as jest.Mock).mock.calls.filter((c) => c[0] === 'festival_nudge_shown')).toHaveLength(1);
  });

  it('keeps showing it the same day without counting it again, even after the app is reopened', async () => {
    await mountHook();
    const again = await mountHook();
    expect(again.current.nudge?.opportunity.holiday.id).toBe('diwali');
    expect(JSON.parse(store.get('occasio.festivalCoach.v1.u1')!).shown['diwali:2026'].count).toBe(1);
  });

  it('puts a festival away for the year when the person says not now, and remembers it', async () => {
    const hook = await mountHook();
    await act(async () => hook.current.snoozeNudge());
    expect(hook.current.nudge).toBeNull();
    expect(hook.current.opportunities.map((o) => o.holiday.id)).not.toContain('diwali');
    expect(JSON.parse(store.get('occasio.festivalCoach.v1.u1')!).snoozed['diwali:2026']).toEqual(expect.any(String));
    const reopened = await mountHook();
    expect(reopened.current.nudge?.opportunity.holiday.id).not.toBe('diwali');
  });

  describe('the plan prompt', () => {
    it('replaces the nudge for someone with no wish left who has a festival and people for it', async () => {
      const hook = await mountHook({ wishesReady: 0 });
      expect(hook.current.planPrompt?.title).toBe('Diwali is in 2 days');
      expect(hook.current.planPrompt?.body).toContain('Mom and Priya are in your Vault and your wishes are used');
      expect(hook.current.nudge).toBeNull();
      const saved = JSON.parse(store.get('occasio.festivalCoach.v1.u1')!);
      expect(saved.prompts['plan:diwali:2026']).toEqual(expect.any(String));
      expect((trackEvent as jest.Mock).mock.calls.filter((c) => c[0] === 'plan_prompt_shown')).toHaveLength(1);
    });

    it('is never offered to someone who has wishes left, is on Pro, or is a guest', async () => {
      expect((await mountHook({ wishesReady: 2 })).current.planPrompt).toBeNull();
      expect((await mountHook({ wishesReady: null })).current.planPrompt).toBeNull();
      expect((await mountHook({ wishesReady: 0, isPro: true })).current.planPrompt).toBeNull();
      expect((await mountHook({ wishesReady: 0, uid: null })).current.planPrompt).toBeNull();
    });

    it('carries on the same day, and is not counted or announced twice', async () => {
      await mountHook({ wishesReady: 0 });
      const again = await mountHook({ wishesReady: 0 });
      expect(again.current.planPrompt?.key).toBe('plan:diwali:2026');
      expect((trackEvent as jest.Mock).mock.calls.filter((c) => c[0] === 'plan_prompt_shown')).toHaveLength(1);
    });

    it('goes away for a week when put away, and the nudge does not step into its place that day', async () => {
      const hook = await mountHook({ wishesReady: 0 });
      await act(async () => hook.current.dismissPlanPrompt());
      expect(hook.current.planPrompt).toBeNull();
      expect(hook.current.nudge).toBeNull();
      expect((trackEvent as jest.Mock).mock.calls.filter((c) => c[0] === 'plan_prompt_dismissed')).toHaveLength(1);
      const reopened = await mountHook({ wishesReady: 0 });
      expect(reopened.current.planPrompt).toBeNull();
      expect(reopened.current.nudge).toBeNull();
    });

    it('points at a birthday this week when there is no festival to point at', async () => {
      const hook = await mountHook({
        wishesReady: 0,
        people: [],
        entries: [],
        birthdays: [{ id: 'sam', name: 'Sam Rao', daysUntil: 3 }],
        // nothing in the Vault for a festival to be for
        region: 'US',
      });
      expect(hook.current.planPrompt?.title).toBe('Sam’s birthday is in 3 days'.replace('’', "'"));
    });
  });

  it('says nothing while the screen is out of view, and remembers nothing for a guest', async () => {
    const hidden = await mountHook({ enabled: false });
    expect(hidden.current.nudge).toBeNull();
    expect(store.size).toBe(0);
    const guest = await mountHook({ uid: null, people: [], entries: [] });
    expect(guest.current.opportunities.length).toBeGreaterThan(0);
    expect(store.size).toBe(0);
  });
});

describe('the pieces of the coach on screen', () => {
  const opportunities = planOpportunities({
    now,
    region: 'IN',
    people: people.map((p) => ({ id: p.id, name: p.personName, relationship: p.relationshipType })),
    wishes: entries,
    wishesReady: 3,
    state: EMPTY_COACH_STATE,
  });
  const nudge = chooseNudge(opportunities, EMPTY_COACH_STATE, now, 3)!;

  it('shows the nudge in plain words, starts it in one tap, and puts it away for the year', async () => {
    const onStart = jest.fn();
    const onSnooze = jest.fn();
    const tree = await render(
      <ReminderCard
        holidayId={nudge.opportunity.holiday.id}
        title={nudge.title}
        body={nudge.body}
        actionLabel={nudge.actionLabel}
        laterLabel="Not now for Diwali"
        laterHint="Stops reminders for this festival until next year"
        onAction={onStart}
        onLater={onSnooze}
      />,
    );
    const text = textOf(tree.root);
    expect(text).toContain('Diwali is in 2 days');
    expect(text).toContain('Mom and Priya are in your Vault. A photo and a few words is enough.');
    expect(text).toContain('Make a Diwali wish for Mom');
    expect(text).not.toContain('!');
    await press(tree.root, 'Make a Diwali wish for Mom');
    await press(tree.root, 'Not now for Diwali');
    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onSnooze).toHaveBeenCalledTimes(1);
  });

  it('offers a plan in plain words when a festival or birthday needs one, and lets it be put away', async () => {
    const prompts = [
      choosePlanPrompt({ isPro: false, signedIn: true, wishesReady: 0, opportunities, birthdays: [], state: EMPTY_COACH_STATE, now })!,
      choosePlanPrompt({
        isPro: false,
        signedIn: true,
        wishesReady: 0,
        opportunities: [],
        birthdays: [{ id: 'sam', name: 'Sam Rao', daysUntil: 3 }],
        state: EMPTY_COACH_STATE,
        now,
      })!,
    ];
    for (const prompt of prompts) {
      const onAction = jest.fn();
      const onLater = jest.fn();
      const tree = await render(
        <ReminderCard
          holidayId={prompt.holidayId}
          title={prompt.title}
          body={prompt.body}
          actionLabel={prompt.actionLabel}
          laterLabel="Not now for this reminder"
          laterHint="Hides this for a week"
          onAction={onAction}
          onLater={onLater}
        />,
      );
      const text = textOf(tree.root);
      expect(text).toContain('See plans');
      expect(text).toContain('Not now');
      // what a plan is, and that the free path is still there, in the same breath
      expect(text).toMatch(/One wish (for each|is enough for Sam), or Occasio Pro for 24 cards a year\./);
      expect(text).not.toMatch(/!|last chance|hurry|don't miss|only \d+ left|expires/i);
      await press(tree.root, 'See plans');
      await press(tree.root, 'Not now for this reminder');
      expect(onAction).toHaveBeenCalledTimes(1);
      expect(onLater).toHaveBeenCalledTimes(1);
    }
  });

  it('offers the other people a festival is for, by first name, and hands back the one tapped', async () => {
    const onPick = jest.fn();
    const diwali = holidayById('diwali')!;
    const tree = await render(<FestivalNextPeople holiday={diwali} suggested={opportunities[0]!.suggested} onPick={onPick} />);
    expect(textOf(tree.root)).toContain('Wish someone else this Diwali');
    expect(textOf(tree.root)).toContain('Priya');
    expect(textOf(tree.root)).not.toContain('Sharma');
    await press(tree.root, 'Make a Diwali wish for Priya Sharma');
    expect(onPick.mock.calls[0]![0].person.id).toBe('p');
    const empty = await render(<FestivalNextPeople holiday={diwali} suggested={[]} onPick={onPick} />);
    expect(empty.toJSON()).toBeNull();
  });

  it('with no wish left, names the people and offers the plans instead of a button that dead-ends', async () => {
    const onPick = jest.fn();
    const onSeePlans = jest.fn();
    const diwali = holidayById('diwali')!;
    const tree = await render(
      <FestivalNextPeople holiday={diwali} suggested={opportunities[0]!.suggested} onPick={onPick} noWishesLeft onSeePlans={onSeePlans} />,
    );
    const text = textOf(tree.root);
    expect(text).toContain('Mom and Priya are in your Vault and your wishes are used. One wish for each, or Occasio Pro for 24 cards a year.');
    expect(text).not.toContain('!');
    expect(tree.root.findAll((n) => n.props.accessibilityLabel?.startsWith?.('Make a Diwali wish for'))).toHaveLength(0);
    await press(tree.root, 'See plans');
    expect(onSeePlans).toHaveBeenCalledTimes(1);
    expect(onPick).not.toHaveBeenCalled();
    // without a way to open the plans it falls back to the normal buttons rather than showing a dead end
    const fallback = await render(<FestivalNextPeople holiday={diwali} suggested={opportunities[0]!.suggested} onPick={onPick} noWishesLeft />);
    expect(textOf(fallback.root)).toContain('Wish someone else this Diwali');
    expect(textOf(fallback.root)).toContain('A name is all it takes to start.');
  });

  it('says who a festival is for under its date on the Home strip', async () => {
    const tree = await render(
      <UpcomingHolidays
        items={comingUpHolidays(now)}
        now={now}
        hints={{ diwali: 'For Mom and Priya' }}
        onPick={jest.fn()}
        onSeeAll={jest.fn()}
      />,
    );
    expect(textOf(tree.root)).toContain('For Mom and Priya');
  });

  it('draws a festival’s corner decorations, and nothing for any other card', async () => {
    const diwali = await render(<FestivalOrnaments templateType="diwali" />);
    expect(diwali.toJSON()).not.toBeNull();
    expect((await render(<FestivalOrnaments templateType="birthday" />)).toJSON()).toBeNull();
    expect((await render(<FestivalOrnaments templateType={null} />)).toJSON()).toBeNull();
  });
});
