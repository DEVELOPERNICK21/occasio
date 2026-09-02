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
  maxPhotosForMode,
  validatePickedPhoto,
} from '../../src/features/create/domain/photoValidation';
import { MAX_STORAGE_PHOTO_BYTES } from '../../src/shared/config/media';
import {
  isValidShareSlug,
  SHARE_SLUG_LENGTH,
} from '../../src/features/create/domain/shareSlug';
import { EMPTY_CREATION_DRAFT } from '../../src/features/create/domain/types';
import {
  countWishesThisMonth,
  formatOccasionCountdown,
  getCreateHomeSubtitle,
  getMilestoneCardContent,
  getMilestoneLine,
  getUpcomingOccasionsFromVault,
  getVaultNudgeContent,
  shouldShowVaultNudge,
} from '../../src/features/create/domain/createHome';

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

  it('dev bypass allows unlimited free-tier cards', () => {
    expect(canCreateManualCard(99, 'free', { bypassQuota: true })).toBe(true);
    expect(shouldShowPaywall(99, 'free', { bypassQuota: true })).toBe(false);
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

  it('dev links expire in 3 days', () => {
    expect(shareLinkTtlDays('free', true, { devShortTtl: true })).toBe(3);
  });

  it('paid links expire in 365 days', () => {
    expect(shareLinkTtlDays('personal', false)).toBe(365);
    expect(shareLinkTtlDays('family', false)).toBe(365);
  });

  it('computeShareLinkExpiresAt adds TTL from createdAt', () => {
    const createdAt = new Date('2026-08-01T12:00:00.000Z');
    const expiresAt = computeShareLinkExpiresAt(createdAt, 'free', true);
    expect(expiresAt.toISOString()).toBe('2026-08-31T12:00:00.000Z');
  });

  it('computeShareLinkExpiresAt uses 3-day dev TTL', () => {
    const createdAt = new Date('2026-08-01T12:00:00.000Z');
    const expiresAt = computeShareLinkExpiresAt(createdAt, 'free', true, {
      devShortTtl: true,
    });
    expect(expiresAt.toISOString()).toBe('2026-08-04T12:00:00.000Z');
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

describe('photoValidation', () => {
  it('caps photo count by mode', () => {
    expect(maxPhotosForMode('base64')).toBe(1);
    expect(maxPhotosForMode('storage')).toBe(3);
  });

  it('rejects oversized base64 photos at pick time', () => {
    const huge = `data:image/jpeg;base64,${'a'.repeat(800_000)}`;
    const result = validatePickedPhoto({
      uri: huge,
      currentCount: 0,
      mode: 'base64',
    });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.message).toMatch(/too large/i);
    }
  });

  it('rejects storage photos over 5 MB', () => {
    const result = validatePickedPhoto({
      uri: 'file://photo.jpg',
      currentCount: 0,
      mode: 'storage',
      fileSizeBytes: MAX_STORAGE_PHOTO_BYTES + 1,
    });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.message).toMatch(/5 MB/i);
    }
  });

  it('blocks adding when the photo limit is already reached', () => {
    const result = validatePickedPhoto({
      uri: 'file://photo.jpg',
      currentCount: 1,
      mode: 'base64',
    });
    expect(result.valid).toBe(false);
  });

  it('allows replacing an existing photo when at the limit', () => {
    const result = validatePickedPhoto({
      uri: 'data:image/jpeg;base64,abc',
      currentCount: 1,
      mode: 'base64',
      isReplacing: true,
    });
    expect(result.valid).toBe(true);
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

describe('createHome', () => {
  it('formats occasion countdown copy', () => {
    expect(formatOccasionCountdown(0)).toBe('Today');
    expect(formatOccasionCountdown(1)).toBe('Tomorrow');
    expect(formatOccasionCountdown(12)).toBe('12 days');
  });

  it('sorts upcoming birthdays and caps list length', () => {
    const upcoming = getUpcomingOccasionsFromVault(
      [
        {
          id: 'a',
          userId: 'u',
          personName: 'Later',
          relationshipType: 'friend',
          birthday: { month: 12, day: 31 },
          whatsapp: null,
          autoSendBirthday: false,
          createdAt: '',
          updatedAt: '',
        },
        {
          id: 'b',
          userId: 'u',
          personName: 'Soon',
          relationshipType: 'sibling',
          birthday: { month: 9, day: 2 },
          whatsapp: null,
          autoSendBirthday: false,
          createdAt: '',
          updatedAt: '',
        },
      ],
      1,
      new Date('2026-09-01'),
    );

    expect(upcoming).toHaveLength(1);
    expect(upcoming[0]?.personName).toBe('Soon');
  });

  it('counts wishes in the current month', () => {
    const count = countWishesThisMonth(
      [
        {
          id: '1',
          userId: 'u',
          creationId: 'c1',
          shareSlug: 'abcd1234',
          shareUrl: 'https://example.com',
          recipientName: 'Mom',
          templateType: 'birthday',
          message: 'Hi',
          createdAt: '2026-09-01T10:00:00.000Z',
          expiresAt: '2026-10-01T10:00:00.000Z',
        },
        {
          id: '2',
          userId: 'u',
          creationId: 'c2',
          shareSlug: 'efgh5678',
          shareUrl: 'https://example.com',
          recipientName: 'Dad',
          templateType: 'birthday',
          message: 'Hi',
          createdAt: '2026-08-01T10:00:00.000Z',
          expiresAt: '2026-09-01T10:00:00.000Z',
        },
      ],
      new Date('2026-09-15'),
    );

    expect(count).toBe(1);
    expect(getMilestoneLine(0)).toBe('Your first wish takes about two minutes.');
    expect(getMilestoneLine(3)).toBe("You've shared 3 wishes this month.");
    expect(getMilestoneCardContent(0, false).eyebrow).toBe('Getting started');
    expect(getMilestoneCardContent(2, true).headline).toBe("You've shared 2 wishes");
    expect(getMilestoneCardContent(0, true, 3).headline).toBe("You're tracking 3 people");
    expect(getMilestoneCardContent(0, true, 3).headlineHighlight).toBe('3');
  });

  it('shows vault nudge only when upcoming list is empty and not loading', () => {
    expect(shouldShowVaultNudge(0, false)).toBe(true);
    expect(shouldShowVaultNudge(0, true)).toBe(false);
    expect(shouldShowVaultNudge(2, false)).toBe(false);
  });

  it('returns vault nudge copy for guest and signed-in states', () => {
    expect(getVaultNudgeContent(false, 0).actionLabel).toBe('Sign in');
    expect(getVaultNudgeContent(true, 0).title).toBe('Save dates in Vault');
    expect(getVaultNudgeContent(true, 2).title).toBe('Add birthdays to Vault');
  });

  it('uses urgent subtitle only when nearest occasion is within a week', () => {
    expect(getCreateHomeSubtitle(true, [])).toBe(
      'Pick the occasion, then add photos and your message.',
    );
    expect(
      getCreateHomeSubtitle(true, [
        {
          personId: '1',
          personName: 'Alex',
          relationshipLabel: 'Friend',
          daysUntil: 80,
          label: "Alex's birthday",
        },
      ]),
    ).toBe('Pick the occasion, then add photos and your message.');
    expect(
      getCreateHomeSubtitle(true, [
        {
          personId: '1',
          personName: 'Alex',
          relationshipLabel: 'Friend',
          daysUntil: 3,
          label: "Alex's birthday",
        },
      ]),
    ).toBe('Someone you care about has a date coming up. A small gesture goes far.');
  });
});
