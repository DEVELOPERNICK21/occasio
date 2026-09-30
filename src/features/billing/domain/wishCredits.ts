import { WISH_CREDIT_PRODUCT_IDS } from './entitlements';

/** Count single-wish purchases among one-time store transactions. */
export function countPurchasedWishCredits(
  productIdentifiers: readonly string[],
  creditProductIds: readonly string[] = WISH_CREDIT_PRODUCT_IDS,
): number {
  return productIdentifiers.filter((id) => creditProductIds.includes(id)).length;
}

export function availableWishCredits(purchased: number, used: number): number {
  return Math.max(0, purchased - Math.max(0, used));
}
