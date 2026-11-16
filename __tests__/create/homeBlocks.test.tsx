import React from 'react';
import TestRenderer, { act, type ReactTestInstance } from 'react-test-renderer';

const mockAuth = jest.fn();
const mockPaywall = jest.fn();
const mockBalance = jest.fn();
const mockHistory = jest.fn();
const mockVault = jest.fn();
const mockOpenForced = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useIsFocused: () => true,
  useScrollToTop: jest.fn(),
}));
jest.mock('../../src/features/auth/application/useAuth', () => ({ useAuth: () => mockAuth() }));
jest.mock('../../src/features/billing/application/usePaywall', () => ({ usePaywall: () => mockPaywall() }));
jest.mock('../../src/features/billing/application/useWishBalance', () => ({ useWishBalance: () => mockBalance() }));
jest.mock('../../src/features/history/application/useHistory', () => ({ useHistory: () => mockHistory() }));
jest.mock('../../src/features/vault/application/useVaultPeople', () => ({ useVaultPeople: () => mockVault() }));
jest.mock('../../src/features/create/application/CreateDraftContext', () => ({
  useCreateDraftContext: () => ({ startFromAudience: jest.fn(), startFromHoliday: jest.fn(), startQuickCreate: jest.fn() }),
}));
jest.mock('../../src/features/create/application/useBadgeCelebration', () => ({
  useBadgeCelebration: () => ({ celebrating: null, dismiss: jest.fn() }),
}));
jest.mock('../../src/shared/platform/haptics', () => ({ triggerSuccessHaptic: jest.fn(), triggerCardHaptic: jest.fn() }));
jest.mock('../../src/shared/analytics/events', () => ({
  ...jest.requireActual('../../src/shared/analytics/events'),
  trackEvent: jest.fn(),
}));
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

import AsyncStorage from '@react-native-async-storage/async-storage';
import { trackEvent } from '../../src/shared/analytics/events';
import { CreateHomeScreen } from '../../src/features/create/ui/screens/CreateHomeScreen';
import { NO_PURCHASES, computeWishBalance } from '../../src/features/billing/domain/wishBalance';

const store = (AsyncStorage as unknown as { __store: Map<string, string> }).__store;
const navigate = jest.fn();
const navigation = { navigate } as never;

// Friday 6 November 2026: Diwali is on Sunday, two days away.
const NOW = new Date(2026, 10, 6, 10, 0, 0);
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 24 * 60 * 60 * 1000).toISOString();
const mom = { id: 'm', personName: 'Mom', relationshipType: 'mom' };
const priya = { id: 'p', personName: 'Priya Sharma', relationshipType: 'friend' };
const entry = (n: number, who = 'Priya') => ({
  id: `e${n}`,
  recipientName: who,
  templateType: 'birthday',
  createdAt: daysAgo(n),
});
/** A real balance with this many wishes ready: the free card is used, the rest are bought. */
const balance = (ready: number) =>
  computeWishBalance(
    { freeCardsUsed: 1, wishCreditsUsed: 0, proCardTimes: [] },
    { ...NO_PURCHASES, creditsPurchased: ready },
    NOW,
  );

type World = {
  signedIn?: boolean;
  tier?: 'free' | 'personal';
  ready?: number | null;
  entries?: ReturnType<typeof entry>[];
  people?: (typeof mom)[];
  historyLoading?: boolean;
  vaultLoading?: boolean;
};
function world({
  signedIn = true,
  tier = 'free',
  ready = 3,
  entries = [],
  people = [],
  historyLoading = false,
  vaultLoading = false,
}: World = {}) {
  mockAuth.mockReturnValue({ isSignedIn: signedIn, user: signedIn ? { uid: 'u1' } : null });
  mockPaywall.mockReturnValue({ tier, openForced: mockOpenForced });
  mockBalance.mockReturnValue({
    balance: ready === null ? null : balance(ready),
    settled: true,
    refresh: jest.fn(async () => null),
  });
  mockHistory.mockReturnValue({ entries, isLoading: historyLoading });
  mockVault.mockReturnValue({ people, isLoading: vaultLoading });
}

async function render() {
  let renderer!: TestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = TestRenderer.create(<CreateHomeScreen navigation={navigation} route={{ key: 'k', name: 'CreateHome' } as never} />);
  });
  await act(async () => undefined);
  return renderer;
}
const textOf = (root: ReactTestInstance) =>
  root
    .findAll((n) => (n.type as unknown) === 'Text')
    .map((n) => n.children.join(''))
    .join('\n');
/** Where in the page a piece of text first appears, so order can be checked. */
const at = (text: string, needle: string) => text.indexOf(needle);
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
  jest.useFakeTimers();
  jest.setSystemTime(NOW);
  navigate.mockReset();
  mockOpenForced.mockReset();
  (trackEvent as jest.Mock).mockClear();
});
afterEach(() => jest.useRealTimers());

describe('Home for someone new', () => {
  it('shows a guest the festivals, who it is for and the quick wish, and nothing that is empty', async () => {
    world({ signedIn: false, ready: null });
    const text = textOf((await render()).root);
    expect(text).toContain('Festivals coming up');
    expect(text).toContain('Who is it for?');
    expect(at(text, 'Festivals coming up')).toBeLessThan(at(text, 'Who is it for?'));
    for (const empty of ['Coming up', 'badge', 'Wishes left', 'Save to Vault']) expect(text).not.toContain(empty);
  });

  it('adds the wish balance for a new member, still with no journey and no Vault section', async () => {
    world({ ready: 1 });
    const text = textOf((await render()).root);
    expect(text).toContain('Festivals coming up');
    expect(text).toContain('Who is it for?');
    expect(text).toContain('1 wish');
    for (const empty of ['Your wish journey', 'Save to Vault', 'Next badge']) expect(text).not.toContain(empty);
  });
});

describe('Home for someone who has made cards', () => {
  it('puts the quick wish before the festivals for a regular', async () => {
    world({ entries: [entry(3), entry(20), entry(40), entry(60)], people: [mom, priya], ready: 5 });
    const tree = await render();
    const labels = tree.root.findAll((n) => typeof n.props.accessibilityLabel === 'string').map((n) => n.props.accessibilityLabel as string);
    const wish = labels.findIndex((l) => /wish/i.test(l) && !/festival/i.test(l));
    const strip = labels.findIndex((l) => l === 'Festivals coming up');
    expect(strip).toBeGreaterThan(-1);
    expect(wish).toBeGreaterThan(-1);
    expect(wish).toBeLessThan(strip);
  });

  it('shows someone who has been away no progress to feel behind on', async () => {
    world({ entries: [entry(120), entry(150), entry(200)], people: [mom], ready: 5 });
    const text = textOf((await render()).root);
    expect(text).toContain('Festivals coming up');
    expect(text.toLowerCase()).not.toContain('badge');
    expect(text.toLowerCase()).not.toContain('streak');
  });

  it('waits for the history instead of showing an order it would have to change', async () => {
    world({ historyLoading: true, entries: [] });
    const text = textOf((await render()).root);
    expect(text).not.toContain('Festivals coming up');
    expect(text).not.toContain('Who is it for?');
  });
});

describe('when Home asks for a sale', () => {
  const regular = { entries: [entry(3), entry(20), entry(40)], people: [mom, priya] };
  const seePlans = (text: string) => text.split('See plans').length - 1;
  const prompts = () => (trackEvent as jest.Mock).mock.calls.filter((c) => c[0] === 'plan_prompt_shown');

  it('offers a plan, once, to someone with no wish left, a festival two days away and people for it', async () => {
    world({ ...regular, ready: 0 });
    const tree = await render();
    const text = textOf(tree.root);
    expect(text).toContain('Diwali is in 2 days');
    expect(text).toContain('Mom and Priya are in your Vault and your wishes are used. One wish for each, or Occasio Pro for 24 cards a year.');
    // one sale on the page: the prompt, not the prompt and the balance card both
    expect(seePlans(text)).toBe(1);
    expect(text).not.toContain('No wishes left');
    // the free path is still on the page, not hidden behind the offer
    expect(text).toContain('Who is it for?');
    expect(text).toContain('Quick birthday wish');
    expect(text).not.toMatch(/!|last chance|hurry|don't miss|only \d+ left/i);
    expect(prompts()).toHaveLength(1);
  });

  it('puts it away when asked: the festival offer goes, the plain balance stays, and nothing steps in its place', async () => {
    world({ ...regular, ready: 0 });
    const tree = await render();
    await press(tree.root, 'Not now for this reminder');
    const text = textOf(tree.root);
    expect(text).not.toContain('your wishes are used');
    expect(text).not.toContain('Diwali is in 2 days');
    expect(text).toContain('No wishes left');
    expect(mockOpenForced).not.toHaveBeenCalled();
    expect((trackEvent as jest.Mock).mock.calls.filter((c) => c[0] === 'plan_prompt_dismissed')).toHaveLength(1);
    // and it stays quiet when the app is opened again
    const again = textOf((await render()).root);
    expect(again).not.toContain('your wishes are used');
    expect(again).not.toContain('Diwali is in 2 days');
  });

  it('opens the plans when the offer is taken, and counts it', async () => {
    world({ ...regular, ready: 0 });
    const tree = await render();
    await press(tree.root, 'See plans');
    expect(mockOpenForced).toHaveBeenCalledTimes(1);
    expect((trackEvent as jest.Mock).mock.calls.filter((c) => c[0] === 'plan_prompt_tapped')).toHaveLength(1);
  });

  it('never asks someone who still has wishes, is on Pro, or is not signed in', async () => {
    for (const w of [
      { ...regular, ready: 2 },
      { ...regular, ready: 0, tier: 'personal' as const },
      { signedIn: false, ready: null as number | null },
    ]) {
      store.clear();
      (trackEvent as jest.Mock).mockClear();
      world(w);
      const text = textOf((await render()).root);
      expect(text).not.toContain('your wishes are used');
      expect(prompts()).toHaveLength(0);
    }
  });

  it('shows the festival nudge instead when wishes are left, and never both at once', async () => {
    world({
      people: [mom, priya],
      ready: 3,
      entries: [
        { id: 'a', recipientName: 'Mom', templateType: 'diwali', createdAt: new Date(2025, 9, 19).toISOString() },
        { id: 'b', recipientName: 'Priya', templateType: 'diwali', createdAt: new Date(2025, 9, 19).toISOString() },
        entry(3),
      ],
    });
    const text = textOf((await render()).root);
    expect(text).toContain('Diwali is in 2 days');
    expect(text).toContain('A photo and a few words is enough.');
    expect(text).not.toContain('your wishes are used');
    expect(prompts()).toHaveLength(0);
  });
});
