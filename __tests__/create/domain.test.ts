import { canPreviewDraft } from '../../src/features/create/domain/creationRules';
import {
  canCreateManualCard,
  shouldShowPaywall,
} from '../../src/features/create/domain/quota';
import {
  computeShareLinkExpiresAt,
  shareLinkTtlDays,
} from '../../src/features/create/domain/shareLink';
import {
  isDataUrl,
  isDataUrlWithinLimit,
} from '../../src/features/create/domain/base64Media';
import {
  isValidShareSlug,
  SHARE_SLUG_LENGTH,
} from '../../src/features/create/domain/shareSlug';
import { EMPTY_CREATION_DRAFT } from '../../src/features/create/domain/types';

describe('creationRules', () => {
  it('canPreviewDraft requires template, photo, and name', () => {
    expect(canPreviewDraft(EMPTY_CREATION_DRAFT)).toBe(false);
    expect(
      canPreviewDraft({
        ...EMPTY_CREATION_DRAFT,
        templateType: 'birthday',
        photoUris: ['file://a.jpg'],
        recipientName: 'Mom',
      }),
    ).toBe(true);
  });
});

describe('quota', () => {
  it('free tier allows 1 card per month', () => {
    expect(canCreateManualCard(0, 'free')).toBe(true);
    expect(canCreateManualCard(1, 'free')).toBe(false);
    expect(shouldShowPaywall(1, 'free')).toBe(true);
  });

  it('paid tiers are unlimited', () => {
    expect(canCreateManualCard(99, 'personal')).toBe(true);
    expect(canCreateManualCard(99, 'family')).toBe(true);
  });
});

describe('shareLink', () => {
  it('guest and free links expire in 30 days', () => {
    expect(shareLinkTtlDays('free', true)).toBe(30);
    expect(shareLinkTtlDays('free', false)).toBe(30);
  });

  it('paid links expire in 365 days', () => {
    expect(shareLinkTtlDays('personal', false)).toBe(365);
    expect(shareLinkTtlDays('family', false)).toBe(365);
  });

  it('computeShareLinkExpiresAt adds TTL from createdAt', () => {
    const createdAt = new Date('2026-08-01T12:00:00Z');
    const expiresAt = computeShareLinkExpiresAt(createdAt, 'free', true);
    expect(expiresAt.toISOString()).toBe('2026-08-31T12:00:00.000Z');
  });
});

describe('base64Media', () => {
  it('detects data URLs', () => {
    expect(isDataUrl('data:image/jpeg;base64,abc')).toBe(true);
    expect(isDataUrl('file://photo.jpg')).toBe(false);
  });

  it('enforces size budget', () => {
    const small = `data:image/jpeg;base64,${'a'.repeat(100)}`;
    const huge = `data:image/jpeg;base64,${'a'.repeat(800_000)}`;
    expect(isDataUrlWithinLimit(small)).toBe(true);
    expect(isDataUrlWithinLimit(huge)).toBe(false);
  });
});

describe('shareSlug', () => {
  it('validates production slug format', () => {
    expect(isValidShareSlug('6agd6sg9')).toBe(true);
    expect(isValidShareSlug('demo-mom-abc')).toBe(false);
    expect(isValidShareSlug('abc')).toBe(false);
    expect(SHARE_SLUG_LENGTH).toBe(8);
  });
});
