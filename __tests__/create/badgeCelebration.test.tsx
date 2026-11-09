import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

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

jest.mock('../../src/shared/platform/haptics', () => ({
  triggerSuccessHaptic: jest.fn(),
  triggerCardHaptic: jest.fn(),
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useBadgeCelebration } from '../../src/features/create/application/useBadgeCelebration';
import { BadgeCelebration } from '../../src/features/create/ui/components/BadgeCelebration';
import { WishBalanceCard } from '../../src/features/create/ui/components/WishBalanceCard';
import {
  BADGE_SET_VERSION,
  computeWishJourney,
  type WishBadge,
} from '../../src/features/create/domain/wishJourney';
import {
  NO_PURCHASES,
  computeWishBalance,
} from '../../src/features/billing/domain/wishBalance';

const store = (AsyncStorage as unknown as { __store: Map<string, string> }).__store;
const now = new Date(2026, 8, 27);
const entry = (name: string, type?: string) => ({
  createdAt: new Date(2026, 8, 10).toISOString(),
  recipientName: name,
  templateType: type,
});

/** Mounts the hook and lets its storage reads and writes settle. */
async function mountHook(uid: string, badges: readonly WishBadge[], ready = true) {
  const seen: { current: ReturnType<typeof useBadgeCelebration> | null } = { current: null };
  function Probe() {
    seen.current = useBadgeCelebration(uid, badges, ready);
    return null;
  }
  await act(async () => {
    TestRenderer.create(<Probe />);
  });
  await act(async () => undefined);
  return seen as { current: ReturnType<typeof useBadgeCelebration> };
}

beforeEach(() => store.clear());

describe('celebrating a badge', () => {
  it('does not celebrate what an account already had on the first run', async () => {
    const { badges } = computeWishJourney([entry('A'), entry('B'), entry('C')], 1, now);
    const hook = await mountHook('u1', badges);
    expect(hook.current.celebrating).toBeNull();
    expect(JSON.parse(store.get('occasio.badges.seen.v1.u1')!)).toEqual(
      expect.arrayContaining(['first_wish', 'three_wishes', 'vault_saved']),
    );
    expect(store.get('occasio.badges.set.u1')).toBe(String(BADGE_SET_VERSION));
  });

  it('does not shower someone with the badges added since they last looked', async () => {
    // Stored before the set grew (no version): they already qualify for a thank-you badge.
    store.set('occasio.badges.seen.v1.u1', JSON.stringify(['first_wish']));
    const { badges } = computeWishJourney([entry('A', 'thank_you')], 0, now);
    expect(badges.find((b) => b.id === 'thank_you')?.unlocked).toBe(true);

    const hook = await mountHook('u1', badges);
    expect(hook.current.celebrating).toBeNull();
    expect(JSON.parse(store.get('occasio.badges.seen.v1.u1')!)).toEqual(
      expect.arrayContaining(['first_wish', 'thank_you']),
    );
    expect(store.get('occasio.badges.set.u1')).toBe(String(BADGE_SET_VERSION));
  });

  it('celebrates a badge earned after that, once, then moves on', async () => {
    store.set('occasio.badges.seen.v1.u1', JSON.stringify(['first_wish']));
    store.set('occasio.badges.set.u1', String(BADGE_SET_VERSION));
    const { badges } = computeWishJourney([entry('A'), entry('B'), entry('C')], 0, now);

    const hook = await mountHook('u1', badges);
    expect(hook.current.celebrating?.id).toBe('three_wishes');

    await act(async () => {
      hook.current.dismiss();
    });
    await act(async () => undefined);
    expect(hook.current.celebrating).toBeNull();
    expect(JSON.parse(store.get('occasio.badges.seen.v1.u1')!)).toContain('three_wishes');
  });

  it('waits until the cards and the Vault have loaded', async () => {
    store.set('occasio.badges.seen.v1.u1', JSON.stringify([]));
    store.set('occasio.badges.set.u1', String(BADGE_SET_VERSION));
    const { badges } = computeWishJourney([entry('A')], 0, now);
    const hook = await mountHook('u1', badges, false);
    expect(hook.current.celebrating).toBeNull();
  });
});

describe('BadgeCelebration', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  const journey = computeWishJourney([entry('Priya')], 0, now);
  const first = journey.badges.find((b) => b.id === 'first_wish')!;
  const vault = computeWishJourney([], 1, now).badges.find((b) => b.id === 'vault_saved')!;

  async function render(badge: WishBadge, handlers = { onCreate: jest.fn(), onVault: jest.fn(), onDismiss: jest.fn() }) {
    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(
        <BadgeCelebration
          badge={badge}
          firstName="Priya"
          next={journey.nextBadge}
          {...handlers}
        />,
      );
    });
    return { renderer: renderer!, ...handlers };
  }

  /** Taps the button with this label: finds its text, then the nearest thing above it that can be pressed. */
  async function press(renderer: TestRenderer.ReactTestRenderer, label: string) {
    const text = renderer.root.findAll((n) => n.props.children === label)[0];
    let node: TestRenderer.ReactTestInstance | null = text ?? null;
    while (node && typeof node.props.onPress !== 'function') node = node.parent;
    expect(node).not.toBeNull();
    await act(async () => {
      node!.props.onPress();
    });
  }

  it('has Pip say something warm and specific, and shows what to aim for next', async () => {
    const { renderer } = await render(first);
    const json = JSON.stringify(renderer.toJSON());
    expect(json).toContain('Badge earned');
    expect(json).toContain('First wish');
    expect(json).toContain('You sent your first wish. Someone felt remembered today.');
    expect(json).toContain('Pip');
    expect(json).toContain('Priya will open it soon, and know you thought of them.');
    expect(json).toContain('Next badge: ');
  });

  it('leads straight on to making another wish', async () => {
    const { renderer, onCreate, onVault, onDismiss } = await render(first);
    await press(renderer, 'Make another wish');
    await act(async () => {
      jest.advanceTimersByTime(400);
    });
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onCreate).toHaveBeenCalledTimes(1);
    expect(onVault).not.toHaveBeenCalled();
  });

  it('leads a Vault badge on to the Vault', async () => {
    const { renderer, onCreate, onVault } = await render(vault);
    await press(renderer, 'Save another person');
    await act(async () => {
      jest.advanceTimersByTime(400);
    });
    expect(onVault).toHaveBeenCalledTimes(1);
    expect(onCreate).not.toHaveBeenCalled();
  });

  it('lets someone say not now, without going anywhere', async () => {
    const { renderer, onCreate, onVault, onDismiss } = await render(first);
    await press(renderer, 'Maybe later');
    await act(async () => {
      jest.advanceTimersByTime(400);
    });
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onCreate).not.toHaveBeenCalled();
    expect(onVault).not.toHaveBeenCalled();
  });

  it('shows nothing when there is no badge', async () => {
    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(
        <BadgeCelebration badge={null} onCreate={jest.fn()} onVault={jest.fn()} onDismiss={jest.fn()} />,
      );
    });
    expect(renderer!.toJSON()).toBeNull();
  });
});

describe('WishBalanceCard', () => {
  const day = 24 * 60 * 60 * 1000;
  const render = async (element: React.ReactElement) => {
    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(element);
    });
    return renderer!;
  };

  it('says how many wishes are ready and where they come from', async () => {
    const balance = computeWishBalance(
      { freeCardsUsed: 1, wishCreditsUsed: 1, proCardTimes: [] },
      { ...NO_PURCHASES, creditsPurchased: 3, lastCreditPurchasedAt: null },
      new Date(2026, 10, 9),
    );
    const renderer = await render(<WishBalanceCard balance={balance} onPress={jest.fn()} />);
    const json = JSON.stringify(renderer.toJSON());
    expect(json).toContain('2 wishes ready');
    expect(json).toContain('2 extra wishes');
    expect(json).not.toContain('See plans');
  });

  it('opens the profile when tapped', async () => {
    const onPress = jest.fn();
    const balance = computeWishBalance({ freeCardsUsed: 0, wishCreditsUsed: 0, proCardTimes: [] }, NO_PURCHASES);
    const renderer = await render(<WishBalanceCard balance={balance} onPress={onPress} />);
    const row = renderer.root.findAll((n) => typeof n.props.accessibilityLabel === 'string' && n.props.accessibilityLabel.includes('Open your plan'))[0]!;
    await act(async () => {
      row.props.onPress();
    });
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('says plainly when there is nothing left, and offers the plans', async () => {
    const onGetMore = jest.fn();
    const balance = computeWishBalance({ freeCardsUsed: 1, wishCreditsUsed: 0, proCardTimes: [] }, NO_PURCHASES);
    const renderer = await render(<WishBalanceCard balance={balance} onPress={jest.fn()} onGetMore={onGetMore} />);
    const json = JSON.stringify(renderer.toJSON());
    expect(json).toContain('No wishes left');
    expect(json).toContain('Your free card is used.');
    const more = renderer.root.findAll((n) => n.props.accessibilityLabel === 'See plans')[0]!;
    await act(async () => {
      more.props.onPress();
    });
    expect(onGetMore).toHaveBeenCalledTimes(1);
  });

  it('tells a Pro member who is out when the next card opens', async () => {
    const today = Date.now();
    const times = Array.from({ length: 24 }, (_, i) => today - (i + 1) * day);
    const balance = computeWishBalance(
      { freeCardsUsed: 1, wishCreditsUsed: 0, proCardTimes: times },
      { ...NO_PURCHASES, pro: { productId: 'occasio_pro_yearly', expiresAt: null, willRenew: true } },
    );
    const renderer = await render(<WishBalanceCard balance={balance} onPress={jest.fn()} />);
    expect(JSON.stringify(renderer.toJSON())).toContain('All 24 Pro cards for the year are used.');
  });
});
