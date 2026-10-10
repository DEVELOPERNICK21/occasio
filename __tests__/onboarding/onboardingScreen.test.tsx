import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import {
  setPendingOnboardingIntent,
  takePendingOnboardingIntent,
} from '../../src/features/onboarding/application/onboardingHandoff';
import { OnboardingScreen } from '../../src/features/onboarding/ui/screens/OnboardingScreen';
import { PIP_BOB_CYCLES } from '../../src/shared/ui/Pip';
import { trackEvent } from '../../src/shared/analytics/events';

jest.mock('react-native-haptic-feedback', () => ({ trigger: jest.fn() }));
// The shared analytics module reads stored consent, so it needs a storage to read from.
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async () => null),
    setItem: jest.fn(async () => undefined),
    removeItem: jest.fn(async () => undefined),
  },
}));
jest.mock('../../src/shared/analytics/events', () => ({
  ...jest.requireActual('../../src/shared/analytics/events'),
  trackEvent: jest.fn(),
}));

const mockSubscription = {
  plans: [] as Array<Record<string, unknown>>,
  isConfigured: true,
  isReady: true,
  isPaid: false,
  isPurchasing: false,
  error: null as string | null,
  purchase: jest.fn(async () => true),
  restore: jest.fn(async () => false),
  clearError: jest.fn(),
};
jest.mock('../../src/features/billing/application/useSubscription', () => ({
  useSubscription: () => mockSubscription,
}));

const PLANS = [
  { id: 'monthly', title: 'Monthly', priceLabel: '₹149', periodLabel: 'Billed monthly', priceAmount: 149 },
  { id: 'yearly', title: 'Yearly', priceLabel: '₹999', periodLabel: 'Billed yearly', priceAmount: 999, perMonthLabel: '₹83.25' },
  { id: 'single_wish', title: 'One wish', priceLabel: '₹49', periodLabel: 'One-time', priceAmount: 49 },
];

type Renderer = TestRenderer.ReactTestRenderer;

function setup() {
  const navigation = { reset: jest.fn() };
  const onComplete = jest.fn(async () => undefined);
  let renderer!: Renderer;
  act(() => {
    renderer = TestRenderer.create(
      <OnboardingScreen navigation={navigation as never} route={{} as never} onComplete={onComplete} />,
    );
  });
  return { renderer, navigation, onComplete };
}

const screenText = (r: Renderer) => JSON.stringify(r.toJSON());

function pressable(r: Renderer, match: RegExp) {
  const node = r.root
    .findAll(
      (n) =>
        typeof n.props.onPress === 'function' &&
        match.test(String(n.props.accessibilityLabel ?? n.props.label ?? '')),
    )
    .at(0);
  if (!node) {
    throw new Error(`No pressable matching ${match}`);
  }
  return node;
}

const press = (r: Renderer, match: RegExp) => act(() => pressable(r, match).props.onPress());
const pressAsync = (r: Renderer, match: RegExp) =>
  act(async () => {
    await pressable(r, match).props.onPress();
  });

/** `dd/mm/yyyy` for a day that is `days` from today (the year is ignored by the flow, so 1962 is fine). */
function dateInDays(days: number): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + days);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/1962`;
}

function typeDate(r: Renderer, text: string) {
  act(() => {
    r.root
      .findAll((n) => n.props.accessibilityLabel === 'Pick the date' && typeof n.props.onChangeText === 'function')
      .at(0)!
      .props.onChangeText(text);
  });
}

/** who → Mom (a birthday), when → the date. Ends on the dream step. */
function walkToDream(r: Renderer, daysAway = 23) {
  press(r, /^Mom\./);
  press(r, /^Continue$/);
  typeDate(r, dateInDays(daysAway));
  press(r, /^Continue$/);
}

function walkToFear(r: Renderer, daysAway = 23) {
  walkToDream(r, daysAway);
  press(r, /^Open the gift$/);
  press(r, /^Continue$/);
}

function walkToReady(r: Renderer, daysAway = 23) {
  walkToFear(r, daysAway);
  press(r, /^I won't forget$/);
}

function walkToOffer(r: Renderer, daysAway = 23) {
  walkToReady(r, daysAway);
  press(r, /^See the plans$/);
}

beforeEach(() => {
  mockSubscription.plans = PLANS;
  mockSubscription.isPaid = false;
  mockSubscription.isPurchasing = false;
  mockSubscription.error = null;
  mockSubscription.purchase.mockClear();
  mockSubscription.restore.mockClear();
  (trackEvent as jest.Mock).mockClear();
  setPendingOnboardingIntent(null);
});

describe('onboarding funnel screen', () => {
  it('opens with Pip and a single question, Continue disabled until one is picked', () => {
    const { renderer } = setup();
    const text = screenText(renderer);
    expect(text).toContain('Who do you never want to forget?');
    expect(text).toContain("Hi, I'm Pip");
    expect(pressable(renderer, /^Continue$/).props.disabled).toBe(true);
    press(renderer, /^Dad\./);
    expect(pressable(renderer, /^Continue$/).props.disabled).toBe(false);
  });

  it('asks for the date in their own words and will not move on without a real one', () => {
    const { renderer } = setup();
    press(renderer, /^Mom\./);
    press(renderer, /^Continue$/);
    expect(screenText(renderer)).toContain("When is Mom's birthday?");
    expect(pressable(renderer, /^Continue$/).props.disabled).toBe(true);

    typeDate(renderer, '31/04/1962');
    expect(pressable(renderer, /^Continue$/).props.disabled).toBe(true);

    typeDate(renderer, '14/08/1962');
    expect(pressable(renderer, /^Continue$/).props.disabled).toBe(false);
    expect(trackEvent).toHaveBeenCalledWith('onboarding_date_set');
  });

  it('follows the occasion chip: a partner starts on the anniversary, and switching changes the question', () => {
    const { renderer } = setup();
    press(renderer, /^Partner\./);
    press(renderer, /^Continue$/);
    expect(screenText(renderer)).toContain('When is your anniversary?');
    press(renderer, /^Birthday$/);
    expect(screenText(renderer)).toContain("When is your partner's birthday?");
    press(renderer, /^Back$/);
    expect(screenText(renderer)).toContain('Who do you never want to forget?');
  });

  it('the dream: the gift opens on tap, and Pip and the card show what the other person feels', () => {
    const { renderer } = setup();
    walkToDream(renderer);
    const before = screenText(renderer);
    expect(before).toContain('Picture Mom opening this.');
    expect(before).toContain('A SURPRISE FOR');
    expect(before).not.toContain('Happy Birthday');

    press(renderer, /^Open the gift$/);
    const after = screenText(renderer);
    expect(after).toContain('Happy Birthday');
    expect(after).toContain('For Mom');
    expect(after).toContain('No app or account needed');
    expect(trackEvent).toHaveBeenCalledWith('onboarding_gift_opened');
  });

  it('the fear: names the cost, and the only number is their own countdown', () => {
    const { renderer } = setup();
    walkToFear(renderer, 23);
    const text = screenText(renderer);
    expect(text).toContain('Now picture the day you forget.');
    expect(text).toContain("Mom's birthday is in 23 days.");
    expect(text).toContain('Pip looking cry');
    expect(pressable(renderer, /^I won't forget$/).props.disabled).toBe(false);
  });

  it('the pledge moves on to the relief and is counted', () => {
    const { renderer } = setup();
    walkToFear(renderer);
    press(renderer, /^I won't forget$/);
    const text = screenText(renderer);
    expect(text).toContain("Be ready before Mom's birthday.");
    expect(text).toContain('You review it for 2 hours');
    expect(text).toContain('Occasio Pro');
    expect(trackEvent).toHaveBeenCalledWith('onboarding_pledged', { hasDate: true });
  });

  it('the urgency is honest: a close date gets a nudge, a far one gets none', () => {
    const close = setup();
    walkToReady(close.renderer, 5);
    expect(screenText(close.renderer)).toContain('That is close. A card takes about two minutes.');

    const far = setup();
    walkToReady(far.renderer, 200);
    const text = screenText(far.renderer);
    expect(text).toContain("Be ready before Mom's birthday.");
    expect(text).not.toContain('A card takes about two minutes');
  });

  it('with no date there is no countdown, no urgency and still a way through', async () => {
    const { renderer, onComplete } = setup();
    press(renderer, /^Mom\./);
    press(renderer, /^Continue$/);
    press(renderer, /^I'll add the date later$/);
    expect(trackEvent).toHaveBeenCalledWith('onboarding_date_skipped');
    expect(screenText(renderer)).toContain('Picture Mom opening this.');

    press(renderer, /^Open the gift$/);
    press(renderer, /^Continue$/);
    expect(screenText(renderer)).not.toMatch(/birthday is (in|today|tomorrow)/);
    press(renderer, /^I won't forget$/);
    expect(screenText(renderer)).not.toContain('A card takes about two minutes');
    press(renderer, /^See the plans$/);
    expect(screenText(renderer)).not.toMatch(/birthday is (in|today|tomorrow)/);

    await pressAsync(renderer, /^Start with my free card$/);
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(trackEvent).toHaveBeenCalledWith(
      'onboarding_completed',
      expect.objectContaining({ hasDate: false, hasIntent: true }),
    );
  });

  it('ends on an honest offer: real prices, a computed saving, no one-off wish, no pre-selection', () => {
    const { renderer } = setup();
    walkToOffer(renderer);
    const text = screenText(renderer);
    expect(text).toContain('Never be the one who forgot.');
    expect(text).toContain("Mom's birthday is in 23 days.");
    expect(text).toContain('₹999 a year');
    expect(text).toContain('₹83.25 a month');
    expect(text).toContain('Save 44%');
    expect(text).toContain('₹149 a month');
    expect(text).not.toContain('One wish');
    expect(text).toContain('Your first card is free');
    expect(text).toContain('renew automatically');
    expect(text).toContain('Restore purchases');
    expect(mockSubscription.purchase).not.toHaveBeenCalled();
  });

  it('buys exactly the plan that was tapped', async () => {
    const { renderer } = setup();
    walkToOffer(renderer);
    await pressAsync(renderer, /^Yearly\./);
    expect(mockSubscription.purchase).toHaveBeenCalledWith('yearly');
    expect(trackEvent).toHaveBeenCalledWith('onboarding_plan_selected', { planId: 'yearly' });
  });

  it('finishes on the free card and hands the first card to the Create flow', async () => {
    const { renderer, navigation, onComplete } = setup();
    walkToOffer(renderer);
    await pressAsync(renderer, /^Start with my free card$/);
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(navigation.reset).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'MainTabs' }] });
    expect(takePendingOnboardingIntent()).toEqual({ audience: 'mom', occasion: 'birthday' });
    expect(trackEvent).toHaveBeenCalledWith('onboarding_completed', {
      steps: 6,
      plan: 'free',
      hasIntent: true,
      hasDate: true,
    });
  });

  it('recognises an existing subscriber instead of selling again', async () => {
    mockSubscription.isPaid = true;
    const { renderer, onComplete } = setup();
    walkToOffer(renderer);
    const text = screenText(renderer);
    expect(text).toContain('Occasio Pro is on');
    expect(text).toContain('are included');
    expect(text).not.toContain('₹999 a year');
    await pressAsync(renderer, /^Create your first card$/);
    expect(onComplete).toHaveBeenCalled();
    expect(trackEvent).toHaveBeenCalledWith(
      'onboarding_completed',
      expect.objectContaining({ plan: 'pro' }),
    );
  });

  it('still lets people continue free when plans cannot load', () => {
    mockSubscription.plans = [];
    const { renderer } = setup();
    walkToOffer(renderer);
    expect(screenText(renderer)).toContain('Plans appear here when you are online');
    expect(pressable(renderer, /^Start with my free card$/).props.disabled).toBe(false);
  });

  it('keeps the mascot animation finite so the accessibility tree can refresh (it never loops forever)', () => {
    expect(Number.isFinite(PIP_BOB_CYCLES)).toBe(true);
    expect(PIP_BOB_CYCLES).toBeGreaterThan(0);
  });

  it('can be skipped from any step, and skipping carries nothing into Create', async () => {
    const { renderer, navigation, onComplete } = setup();
    press(renderer, /^Mom\./);
    press(renderer, /^Continue$/);
    await pressAsync(renderer, /^Skip onboarding$/);
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(navigation.reset).toHaveBeenCalled();
    expect(takePendingOnboardingIntent()).toBeNull();
    expect(trackEvent).toHaveBeenCalledWith('onboarding_skipped', { atSlide: 2, step: 'when' });
  });
});
