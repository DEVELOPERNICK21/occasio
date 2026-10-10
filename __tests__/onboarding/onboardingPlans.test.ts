import type { BillingPlan } from '../../src/features/billing/domain/types';
import {
  hasSubscriptionPlans,
  pickSubscriptionPlans,
  planPerMonthLine,
  planPriceLine,
  yearlySavingsPercent,
} from '../../src/features/onboarding/domain/onboardingPlans';

const monthly: BillingPlan = {
  id: 'monthly',
  title: 'Monthly',
  priceLabel: '₹149',
  periodLabel: 'Billed monthly',
  priceAmount: 149,
};
const yearly: BillingPlan = {
  id: 'yearly',
  title: 'Yearly',
  priceLabel: '₹999',
  periodLabel: 'Billed yearly',
  priceAmount: 999,
  perMonthLabel: '₹83.25',
};
const single: BillingPlan = {
  id: 'single_wish',
  title: 'One wish',
  priceLabel: '₹49',
  periodLabel: 'One-time, for your next wish',
  priceAmount: 49,
};

describe('pickSubscriptionPlans', () => {
  it('finds both subscriptions and ignores the one-off wish', () => {
    const picked = pickSubscriptionPlans([single, monthly, yearly]);
    expect(picked.monthly?.id).toBe('monthly');
    expect(picked.yearly?.id).toBe('yearly');
  });

  it('recognises store-style ids too', () => {
    const picked = pickSubscriptionPlans([
      { ...monthly, id: '$rc_monthly', title: 'Occasio Pro' },
      { ...yearly, id: '$rc_annual', title: 'Occasio Pro' },
    ]);
    expect(picked.monthly?.id).toBe('$rc_monthly');
    expect(picked.yearly?.id).toBe('$rc_annual');
  });

  it('reports nothing to sell when only the one-off wish exists', () => {
    expect(hasSubscriptionPlans(pickSubscriptionPlans([single]))).toBe(false);
    expect(hasSubscriptionPlans(pickSubscriptionPlans([]))).toBe(false);
    expect(hasSubscriptionPlans(pickSubscriptionPlans([yearly]))).toBe(true);
  });
});

describe('yearlySavingsPercent', () => {
  it('is computed from real prices (999/12 vs 149 → 44%)', () => {
    expect(yearlySavingsPercent(monthly, yearly)).toBe(44);
    expect(pickSubscriptionPlans([monthly, yearly]).yearlySavingsPercent).toBe(44);
  });

  it('stays quiet when the saving is small, missing or nonsense', () => {
    expect(yearlySavingsPercent(monthly, { ...yearly, priceAmount: 1700 })).toBeNull();
    expect(yearlySavingsPercent(monthly, { ...yearly, priceAmount: 1790 })).toBeNull();
    expect(yearlySavingsPercent(monthly, { ...yearly, priceAmount: undefined })).toBeNull();
    expect(yearlySavingsPercent(null, yearly)).toBeNull();
    expect(yearlySavingsPercent({ ...monthly, priceAmount: 0 }, yearly)).toBeNull();
  });
});

describe('plan lines', () => {
  it('words price and period plainly', () => {
    expect(planPriceLine(yearly)).toBe('₹999 a year');
    expect(planPriceLine(monthly)).toBe('₹149 a month');
  });

  it('only shows a per-month price the store provided', () => {
    expect(planPerMonthLine(yearly)).toBe('₹83.25 a month');
    expect(planPerMonthLine({ ...yearly, perMonthLabel: undefined })).toBeNull();
    expect(planPerMonthLine(monthly)).toBeNull();
  });
});
