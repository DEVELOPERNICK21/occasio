import { ENTITLEMENT_PRO } from '../../src/features/billing/domain/entitlements';
import {
  activeEntitlementIdsFromRecord,
  hasProEntitlement,
  tierFromEntitlements,
} from '../../src/features/billing/domain/mapTier';

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
