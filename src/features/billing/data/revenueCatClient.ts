import Purchases, {
  LOG_LEVEL,
  type CustomerInfo,
  type PurchasesOfferings,
  type PurchasesPackage,
} from 'react-native-purchases';
import { isRevenueCatConfigured, revenueCatConfig } from '../../../shared/config/revenueCat';
import { env } from '../../../shared/config/env';
import { appPlatform } from '../../../shared/platform/runtime';
import type { BillingCustomerSnapshot, BillingPlan } from '../domain/types';
import type { SubscriptionTier } from '../domain/types';
import {
  PACKAGE_MONTHLY,
  PACKAGE_SINGLE_WISH,
  PACKAGE_YEARLY,
} from '../domain/entitlements';
import { renewalPeriodLabel } from '../domain/renewalTerms';
import { countPurchasedWishCredits } from '../domain/wishCredits';
import { NO_PURCHASES, purchaseSummaryFrom, type PurchaseSummary } from '../domain/wishBalance';
import {
  activeEntitlementIdsFromRecord,
  hasProEntitlement,
  tierFromEntitlements,
} from '../domain/mapTier';
import { BillingError, billingErrorFromSdk } from './billingErrors';

let configured = false;

function apiKeyForPlatform(): string | null {
  // Debug builds are sideloaded, where Play/App Store billing can't complete.
  if (__DEV__ && revenueCatConfig.testApiKey) {
    return revenueCatConfig.testApiKey;
  }
  const platform = appPlatform();
  if (platform === 'android' && revenueCatConfig.androidApiKey) {
    return revenueCatConfig.androidApiKey;
  }
  if (platform === 'ios' && revenueCatConfig.iosApiKey) {
    return revenueCatConfig.iosApiKey;
  }
  if (revenueCatConfig.testApiKey) {
    return revenueCatConfig.testApiKey;
  }
  return null;
}

export function canUseRevenueCat(): boolean {
  if (env.useMockBilling) {
    return false;
  }
  return isRevenueCatConfigured() && apiKeyForPlatform() !== null;
}

export function isRevenueCatSdkConfigured(): boolean {
  return configured;
}

export function tierFromCustomerInfo(info: CustomerInfo): SubscriptionTier {
  const ids = activeEntitlementIdsFromRecord(info.entitlements.active);
  return tierFromEntitlements(ids);
}

export function hasProFromCustomerInfo(info: CustomerInfo): boolean {
  const ids = activeEntitlementIdsFromRecord(info.entitlements.active);
  return hasProEntitlement(ids);
}

export function snapshotFromCustomerInfo(info: CustomerInfo): BillingCustomerSnapshot {
  const activeEntitlements = activeEntitlementIdsFromRecord(info.entitlements.active);
  return {
    appUserId: info.originalAppUserId,
    originalAppUserId: info.originalAppUserId,
    tier: tierFromEntitlements(activeEntitlements),
    hasPro: hasProEntitlement(activeEntitlements),
    activeEntitlements,
  };
}

function packageTitle(pkg: PurchasesPackage): string {
  const id = pkg.identifier.toLowerCase();
  if (id.includes(PACKAGE_SINGLE_WISH)) {
    return 'One wish';
  }
  if (id.includes(PACKAGE_YEARLY) || pkg.packageType === Purchases.PACKAGE_TYPE.ANNUAL) {
    return 'Yearly';
  }
  if (id.includes(PACKAGE_MONTHLY) || pkg.packageType === Purchases.PACKAGE_TYPE.MONTHLY) {
    return 'Monthly';
  }
  return pkg.product.title || 'Occasio Pro';
}

function packagePeriodLabel(pkg: PurchasesPackage): string {
  const id = pkg.identifier.toLowerCase();
  if (id.includes(PACKAGE_SINGLE_WISH)) {
    return 'One-time, for your next wish';
  }
  if (id.includes(PACKAGE_YEARLY) || pkg.packageType === Purchases.PACKAGE_TYPE.ANNUAL) {
    return renewalPeriodLabel('yearly');
  }
  if (id.includes(PACKAGE_MONTHLY) || pkg.packageType === Purchases.PACKAGE_TYPE.MONTHLY) {
    return renewalPeriodLabel('monthly');
  }
  return 'Subscription, renews until you cancel';
}

function mapPackage(pkg: PurchasesPackage): BillingPlan {
  return {
    id: pkg.identifier,
    title: packageTitle(pkg),
    priceLabel: pkg.product.priceString,
    periodLabel: packagePeriodLabel(pkg),
    priceAmount: pkg.product.price,
    perMonthLabel: pkg.product.pricePerMonthString ?? undefined,
  };
}

function packagesFromOfferings(offerings: PurchasesOfferings): PurchasesPackage[] {
  const current = offerings.current;
  if (current?.availablePackages?.length) {
    return current.availablePackages;
  }

  const first = Object.values(offerings.all)[0];
  return first?.availablePackages ?? [];
}

export async function configureRevenueCat(appUserId?: string | null): Promise<boolean> {
  if (!canUseRevenueCat()) {
    configured = false;
    return false;
  }

  const apiKey = apiKeyForPlatform();
  if (!apiKey) {
    configured = false;
    return false;
  }

  if (__DEV__) {
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  }

  if (!configured) {
    Purchases.configure({
      apiKey,
      appUserID: appUserId ?? undefined,
    });
    configured = true;
    return true;
  }

  if (appUserId) {
    await Purchases.logIn(appUserId);
  }

  return true;
}

export async function syncRevenueCatUser(appUserId: string | null): Promise<void> {
  if (!configured) {
    await configureRevenueCat(appUserId);
    return;
  }

  if (appUserId) {
    await Purchases.logIn(appUserId);
    return;
  }

  // Guests are already anonymous; logging out an anonymous user throws, which used
  // to abort the whole billing refresh and left guests with no plans to show.
  if (await Purchases.isAnonymous()) {
    return;
  }
  await Purchases.logOut();
}

export async function getCustomerInfoSnapshot(): Promise<BillingCustomerSnapshot | null> {
  if (!configured) {
    return null;
  }

  const info = await Purchases.getCustomerInfo();
  return snapshotFromCustomerInfo(info);
}

export async function fetchSubscriptionTier(): Promise<SubscriptionTier> {
  if (!configured) {
    return 'free';
  }

  const info = await Purchases.getCustomerInfo();
  return tierFromCustomerInfo(info);
}

export async function fetchHasPro(): Promise<boolean> {
  if (!configured) {
    return false;
  }

  const info = await Purchases.getCustomerInfo();
  return hasProFromCustomerInfo(info);
}

/** What the store says this person has bought: the Pro plan and how many single wishes. */
export async function fetchPurchaseSummary(): Promise<PurchaseSummary> {
  if (!configured) {
    return NO_PURCHASES;
  }
  return purchaseSummaryFrom(await Purchases.getCustomerInfo());
}

export async function fetchPurchasedWishCredits(): Promise<number> {
  if (!configured) {
    return 0;
  }

  const info = await Purchases.getCustomerInfo();
  return countPurchasedWishCredits(
    info.nonSubscriptionTransactions.map((t) => t.productIdentifier),
  );
}

/**
 * Asks the store and RevenueCat again, instead of answering from what the phone remembers. "Check again"
 * on a pending payment needs this: the cached answer is the one from before the payment went through.
 */
export async function refreshCustomerInfo(): Promise<void> {
  if (!configured) {
    return;
  }
  try {
    await Purchases.invalidateCustomerInfoCache();
    await Purchases.syncPurchases();
  } catch {
    // Not being able to refresh just means the next read is from the cache.
  }
}

export async function fetchBillingPlans(): Promise<BillingPlan[]> {
  if (!configured) {
    return [];
  }

  const offerings = await Purchases.getOfferings();
  return packagesFromOfferings(offerings).map(mapPackage);
}

export async function purchaseBillingPlan(planId: string): Promise<SubscriptionTier> {
  if (!configured) {
    throw new BillingError('NOT_CONFIGURED', 'Billing is not configured yet.');
  }

  const offerings = await Purchases.getOfferings();
  const pkg = packagesFromOfferings(offerings).find((item) => item.identifier === planId);
  if (!pkg) {
    throw new BillingError('STORE', 'That plan is not available right now.');
  }

  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return tierFromCustomerInfo(customerInfo);
  } catch (error) {
    throw billingErrorFromSdk(error);
  }
}

export async function restoreBillingPurchases(): Promise<SubscriptionTier> {
  if (!configured) {
    throw new BillingError('NOT_CONFIGURED', 'Billing is not configured yet.');
  }

  try {
    const info = await Purchases.restorePurchases();
    return tierFromCustomerInfo(info);
  } catch (error) {
    throw billingErrorFromSdk(error);
  }
}

export function addCustomerInfoListener(
  listener: (snapshot: BillingCustomerSnapshot) => void,
): () => void {
  if (!configured) {
    return () => undefined;
  }

  const wrapped = (info: CustomerInfo) => {
    listener(snapshotFromCustomerInfo(info));
  };

  Purchases.addCustomerInfoUpdateListener(wrapped);
  return () => {
    Purchases.removeCustomerInfoUpdateListener(wrapped);
  };
}
