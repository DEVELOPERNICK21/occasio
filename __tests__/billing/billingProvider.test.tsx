import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async () => null),
    setItem: jest.fn(async () => undefined),
    removeItem: jest.fn(async () => undefined),
  },
}));
jest.mock('../../src/features/billing/data/revenueCatClient', () => ({
  addCustomerInfoListener: jest.fn(),
  canUseRevenueCat: jest.fn(() => true),
  configureRevenueCat: jest.fn(async () => true),
  fetchBillingPlans: jest.fn(async () => []),
  fetchHasPro: jest.fn(async () => false),
  fetchPurchasedWishCredits: jest.fn(async () => 0),
  fetchSubscriptionTier: jest.fn(async () => 'free'),
  purchaseBillingPlan: jest.fn(),
  refreshCustomerInfo: jest.fn(async () => undefined),
  restoreBillingPurchases: jest.fn(async () => 'free'),
  syncRevenueCatUser: jest.fn(async () => undefined),
}));
jest.mock('../../src/features/billing/data/revenueCatUi', () => ({
  presentCustomerCenter: jest.fn(),
  presentProPaywall: jest.fn(),
  presentProPaywallIfNeeded: jest.fn(),
}));
jest.mock('../../src/features/billing/data/userTierMirror', () => ({
  syncSubscriptionTier: jest.fn(async () => undefined),
}));
jest.mock('../../src/features/billing/data/wishCreditStore', () => ({
  readWishCreditsUsed: jest.fn(async () => 0),
}));
jest.mock('../../src/features/auth/application/useAuth', () => ({
  useAuth: () => ({ user: { uid: 'user-1' } }),
}));

import {
  BillingProvider,
  useBillingContext,
} from '../../src/features/billing/application/BillingProvider';

type Billing = ReturnType<typeof useBillingContext>;

const mockClient = jest.requireMock('../../src/features/billing/data/revenueCatClient') as Record<
  string,
  jest.Mock
>;

async function mount() {
  const seen: { current: Billing | null } = { current: null };
  function Probe() {
    seen.current = useBillingContext();
    return null;
  }
  await act(async () => {
    TestRenderer.create(
      <BillingProvider>
        <Probe />
      </BillingProvider>,
    );
  });
  return seen as { current: Billing };
}

const pendingError = { code: '20', message: 'The payment is pending.', userCancelled: false };

beforeEach(() => {
  jest.clearAllMocks();
  mockClient.canUseRevenueCat.mockReturnValue(true);
  mockClient.fetchHasPro.mockResolvedValue(false);
  mockClient.fetchSubscriptionTier.mockResolvedValue('free');
  mockClient.fetchPurchasedWishCredits.mockResolvedValue(0);
  mockClient.restoreBillingPurchases.mockResolvedValue('free');
});

describe('a purchase that goes to pending', () => {
  it('is explained as pending, not shown as an error with a code', async () => {
    mockClient.purchaseBillingPlan.mockRejectedValue(pendingError);
    const billing = await mount();

    let bought = true;
    await act(async () => {
      bought = await billing.current.purchase('monthly');
    });

    expect(bought).toBe(false);
    const notice = billing.current.notice;
    expect(notice?.code).toBe('PENDING');
    expect(notice?.tone).toBe('pending');
    expect(notice?.title).toBe('Your payment is pending');
    expect(notice?.message).toContain('Occasio Pro switches on by itself');
    // What the SDK said is never what the person reads.
    expect(`${notice?.title} ${notice?.message}`).not.toMatch(/The payment is pending\.|code|error|\b20\b/i);
  });

  it('says what happens to a single wish, which has to be used afterwards', async () => {
    mockClient.purchaseBillingPlan.mockRejectedValue(pendingError);
    const billing = await mount();
    await act(async () => {
      await billing.current.purchase('single_wish');
    });
    expect(billing.current.notice?.message).toContain('Your extra wish is ready as soon as it goes through');
  });

  it('says "Still pending" when checked and the store has not settled it, then clears once it has', async () => {
    mockClient.purchaseBillingPlan.mockRejectedValue(pendingError);
    const billing = await mount();
    await act(async () => {
      await billing.current.purchase('single_wish');
    });

    let arrived = true;
    await act(async () => {
      arrived = await billing.current.recheckPending();
    });
    expect(arrived).toBe(false);
    expect(billing.current.notice?.title).toBe('Still pending');
    expect(mockClient.refreshCustomerInfo).toHaveBeenCalledTimes(1);

    mockClient.fetchPurchasedWishCredits.mockResolvedValue(1);
    await act(async () => {
      arrived = await billing.current.recheckPending();
    });
    expect(arrived).toBe(true);
    expect(billing.current.notice).toBeNull();
  });

  it('clears by itself when the store confirms a subscription while the app is open', async () => {
    mockClient.purchaseBillingPlan.mockRejectedValue(pendingError);
    const billing = await mount();
    await act(async () => {
      await billing.current.purchase('monthly');
    });
    expect(billing.current.notice?.code).toBe('PENDING');

    const listener = mockClient.addCustomerInfoListener.mock.calls[0]![0] as (snapshot: unknown) => void;
    await act(async () => {
      listener({ tier: 'personal', hasPro: true });
    });
    expect(billing.current.notice).toBeNull();
    expect(billing.current.hasPro).toBe(true);
  });

  it('stays pending when the screen that showed it is left, and goes for other problems', async () => {
    mockClient.purchaseBillingPlan.mockRejectedValue(pendingError);
    const billing = await mount();
    await act(async () => {
      await billing.current.purchase('monthly');
    });
    await act(async () => {
      billing.current.dismissTransient();
    });
    expect(billing.current.notice?.code).toBe('PENDING');

    mockClient.purchaseBillingPlan.mockRejectedValue({ code: '10', message: 'offline' });
    await act(async () => {
      await billing.current.purchase('monthly');
    });
    expect(billing.current.notice?.code).toBe('NETWORK');
    await act(async () => {
      billing.current.dismissTransient();
    });
    expect(billing.current.notice).toBeNull();
  });
});

describe('other outcomes', () => {
  it('says nothing for a purchase the person cancelled', async () => {
    mockClient.purchaseBillingPlan.mockRejectedValue({ code: '1', userCancelled: true });
    const billing = await mount();
    await act(async () => {
      await billing.current.purchase('monthly');
    });
    expect(billing.current.notice).toBeNull();
  });

  it('explains a failure in plain words, whatever the store said', async () => {
    mockClient.purchaseBillingPlan.mockRejectedValue({ code: '4', message: 'PURCHASE_INVALID_ERROR: bad' });
    const billing = await mount();
    await act(async () => {
      await billing.current.purchase('monthly');
    });
    expect(billing.current.notice?.title).toBe('The payment did not go through');
    expect(`${billing.current.notice?.title} ${billing.current.notice?.message}`).not.toContain('PURCHASE_INVALID_ERROR');
  });

  it('says there was nothing to restore, and returns the notice so a screen can show it once', async () => {
    const billing = await mount();
    let outcome: Awaited<ReturnType<Billing['restore']>> | undefined;
    await act(async () => {
      outcome = await billing.current.restore();
    });
    expect(outcome?.restored).toBe(false);
    expect(outcome?.notice?.title).toBe('Nothing to restore');
    expect(billing.current.notice?.code).toBe('NOTHING_TO_RESTORE');
  });

  it('restores quietly when a plan comes back', async () => {
    mockClient.restoreBillingPurchases.mockResolvedValue('personal');
    const billing = await mount();
    let outcome: Awaited<ReturnType<Billing['restore']>> | undefined;
    await act(async () => {
      outcome = await billing.current.restore();
    });
    expect(outcome).toEqual({ restored: true, notice: null });
    expect(billing.current.hasPro).toBe(true);
    expect(billing.current.notice).toBeNull();
  });

  it('does not check anything when billing is not set up', async () => {
    mockClient.canUseRevenueCat.mockReturnValue(false);
    const billing = await mount();
    let arrived = true;
    await act(async () => {
      arrived = await billing.current.recheckPending();
    });
    expect(arrived).toBe(false);
    expect(mockClient.refreshCustomerInfo).not.toHaveBeenCalled();
  });
});
