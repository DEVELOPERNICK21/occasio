import type { BillingPlan } from '../../billing/domain/types';

export type SubscriptionPlans = {
  monthly: BillingPlan | null;
  yearly: BillingPlan | null;
  /** Whole percent saved by paying yearly, from real store prices; `null` when it is not worth stating. */
  yearlySavingsPercent: number | null;
};

function isYearly(plan: BillingPlan): boolean {
  const key = `${plan.id} ${plan.title}`.toLowerCase();
  return key.includes('year') || key.includes('annual');
}

function isMonthly(plan: BillingPlan): boolean {
  const key = `${plan.id} ${plan.title}`.toLowerCase();
  return key.includes('month') && !isYearly(plan);
}

/** Savings only count when they are real and meaningful (>= 5%). Never invented. */
export function yearlySavingsPercent(monthly: BillingPlan | null, yearly: BillingPlan | null): number | null {
  const m = monthly?.priceAmount;
  const y = yearly?.priceAmount;
  if (!m || !y || m <= 0 || y <= 0) {
    return null;
  }
  // Decide on the real saving, then round for display, so a 4.9% saving never reads "5%".
  const raw = (1 - y / 12 / m) * 100;
  return raw >= 5 ? Math.round(raw) : null;
}

/** Picks the two subscription plans and leaves out the one-off "single wish" consumable. */
export function pickSubscriptionPlans(plans: readonly BillingPlan[]): SubscriptionPlans {
  const yearly = plans.find(isYearly) ?? null;
  const monthly = plans.find(isMonthly) ?? null;
  return { monthly, yearly, yearlySavingsPercent: yearlySavingsPercent(monthly, yearly) };
}

export function hasSubscriptionPlans(plans: SubscriptionPlans): boolean {
  return plans.monthly !== null || plans.yearly !== null;
}

export function planPriceLine(plan: BillingPlan): string {
  return isYearly(plan) ? `${plan.priceLabel} a year` : `${plan.priceLabel} a month`;
}

/** "₹83.25 a month" — only when the store gave us one; never computed by hand. */
export function planPerMonthLine(plan: BillingPlan): string | null {
  return isYearly(plan) && plan.perMonthLabel ? `${plan.perMonthLabel} a month` : null;
}
