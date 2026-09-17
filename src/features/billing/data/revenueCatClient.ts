import Purchases, {
  LOG_LEVEL,
  PURCHASES_ERROR_CODE,
  type CustomerInfo,
  type PurchasesOfferings,
  type PurchasesPackage,
} from 'react-native-purchases';
import { isRevenueCatConfigured, revenueCatConfig } from '../../../shared/config/revenueCat';
import { env } from '../../../shared/config/env';
import { appPlatform } from '../../../shared/platform/runtime';
import type { BillingCustomerSnapshot, BillingPlan } from '../domain/types';
import type { SubscriptionTier } from '../../vault/domain/types';
import {
  PACKAGE_LIFETIME,
  PACKAGE_MONTHLY,
  PACKAGE_YEARLY,
} from '../domain/entitlements';
import {
  activeEntitlementIdsFromRecord,
  hasProEntitlement,
  tierFromEntitlements,
} from '../domain/mapTier';
import { BillingError, isPurchaseCancelled } from './billingErrors';

let configured = false;

function apiKeyForPlatform(): string | null {
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
  if (id.includes(PACKAGE_LIFETIME) || pkg.packageType === Purchases.PACKAGE_TYPE.LIFETIME) {
    return 'Lifetime';
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
  if (id.includes(PACKAGE_LIFETIME) || pkg.packageType === Purchases.PACKAGE_TYPE.LIFETIME) {
    return 'One-time purchase';
  }
  if (id.includes(PACKAGE_YEARLY) || pkg.packageType === Purchases.PACKAGE_TYPE.ANNUAL) {
    return 'Billed yearly';
  }
  if (id.includes(PACKAGE_MONTHLY) || pkg.packageType === Purchases.PACKAGE_TYPE.MONTHLY) {
    return 'Billed monthly';
  }
  return 'Subscription';
}

function mapPackage(pkg: PurchasesPackage): BillingPlan {
  return {
    id: pkg.identifier,
    title: packageTitle(pkg),
    priceLabel: pkg.product.priceString,
    periodLabel: packagePeriodLabel(pkg),
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

function toBillingError(error: unknown): BillingError {
  if (isPurchaseCancelled(error)) {
    return new BillingError('CANCELLED', 'Purchase cancelled.');
  }

  if (error && typeof error === 'object' && 'code' in error) {
    const code = String((error as { code?: string }).code);
    if (code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
      return new BillingError('CANCELLED', 'Purchase cancelled.');
    }
    if (
      code === PURCHASES_ERROR_CODE.NETWORK_ERROR ||
      code === PURCHASES_ERROR_CODE.OFFLINE_CONNECTION_ERROR
    ) {
      return new BillingError('NETWORK', 'Check your connection and try again.');
    }
    if (code === PURCHASES_ERROR_CODE.STORE_PROBLEM_ERROR) {
      return new BillingError('STORE', 'Store is unavailable right now.');
    }
  }

  if (error instanceof Error) {
    return new BillingError('INTERNAL', error.message);
  }

  return new BillingError('INTERNAL', 'Something went wrong with billing.');
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
    throw toBillingError(error);
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
    throw toBillingError(error);
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
