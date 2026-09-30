import { ENTITLEMENT_PRO } from '../../src/features/billing/domain/entitlements';
import {
  activeEntitlementIdsFromRecord,
  hasProEntitlement,
  tierFromEntitlements,
} from '../../src/features/billing/domain/mapTier';
import {
  availableWishCredits,
  countPurchasedWishCredits,
} from '../../src/features/billing/domain/wishCredits';

describe('wish credits', () => {
  it('counts only single-wish purchases', () => {
    expect(
      countPurchasedWishCredits([
        'occasio_wish_single',
        'occasio_pro_lifetime',
        'single_wish',
        'occasio_wish_single',
      ]),
    ).toBe(3);
  });

  it('subtracts used credits and never goes negative', () => {
    expect(availableWishCredits(3, 1)).toBe(2);
    expect(availableWishCredits(1, 1)).toBe(0);
    expect(availableWishCredits(1, 4)).toBe(0);
    expect(availableWishCredits(0, -2)).toBe(0);
  });
});

describe('billing entitlements', () => {
  it('maps occasio_pro to personal tier', () => {
    expect(tierFromEntitlements([ENTITLEMENT_PRO])).toBe('personal');
  });

  it('detects occasio_pro entitlement', () => {
    expect(hasProEntitlement([ENTITLEMENT_PRO])).toBe(true);
    expect(hasProEntitlement([])).toBe(false);
  });

  it('returns free when no paid entitlements are active', () => {
    expect(tierFromEntitlements([])).toBe('free');
  });

  it('reads active entitlement ids from RevenueCat active map', () => {
    expect(
      activeEntitlementIdsFromRecord({
        occasio_pro: { identifier: 'occasio_pro' },
      }),
    ).toEqual(['occasio_pro']);
  });
});
