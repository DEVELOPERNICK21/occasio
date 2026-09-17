/**
 * RevenueCat UI surfaces (Paywalls + Customer Center).
 * Only this data module may import `react-native-purchases-ui`.
 *
 * @see https://www.revenuecat.com/docs/tools/paywalls
 * @see https://www.revenuecat.com/docs/tools/customer-center
 */
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';
import { ENTITLEMENT_PRO } from '../domain/entitlements';
import type { PaywallPresentResult } from '../domain/types';
import { BillingError } from './billingErrors';
import { canUseRevenueCat, isRevenueCatSdkConfigured } from './revenueCatClient';

function assertReady(): void {
  if (!canUseRevenueCat() || !isRevenueCatSdkConfigured()) {
    throw new BillingError('NOT_CONFIGURED', 'Billing is not configured yet.');
  }
}

function mapPaywallResult(result: PAYWALL_RESULT): PaywallPresentResult {
  switch (result) {
    case PAYWALL_RESULT.PURCHASED:
      return 'purchased';
    case PAYWALL_RESULT.RESTORED:
      return 'restored';
    case PAYWALL_RESULT.CANCELLED:
      return 'cancelled';
    case PAYWALL_RESULT.NOT_PRESENTED:
      return 'not_presented';
    case PAYWALL_RESULT.ERROR:
    default:
      return 'error';
  }
}

/**
 * Present the dashboard-configured paywall for the current offering
 * only if the user does not already have `occasio_pro`.
 */
export async function presentProPaywallIfNeeded(): Promise<PaywallPresentResult> {
  assertReady();

  try {
    const result = await RevenueCatUI.presentPaywallIfNeeded({
      requiredEntitlementIdentifier: ENTITLEMENT_PRO,
      displayCloseButton: true,
    });
    return mapPaywallResult(result);
  } catch (error) {
    if (__DEV__) {
      console.warn('[Occasio] presentPaywallIfNeeded failed', error);
    }
    return 'error';
  }
}

/** Always present the current offering paywall (dashboard template). */
export async function presentProPaywall(): Promise<PaywallPresentResult> {
  assertReady();

  try {
    const result = await RevenueCatUI.presentPaywall({
      displayCloseButton: true,
    });
    return mapPaywallResult(result);
  } catch (error) {
    if (__DEV__) {
      console.warn('[Occasio] presentPaywall failed', error);
    }
    return 'error';
  }
}

/**
 * Present Customer Center — manage subscription, restore, support.
 * Configure UI in RevenueCat dashboard → Customer Center.
 */
export async function presentCustomerCenter(): Promise<void> {
  assertReady();

  try {
    await RevenueCatUI.presentCustomerCenter();
  } catch (error) {
    if (__DEV__) {
      console.warn('[Occasio] presentCustomerCenter failed', error);
    }
    throw new BillingError(
      'INTERNAL',
      'Could not open subscription management. Try again.',
    );
  }
}
