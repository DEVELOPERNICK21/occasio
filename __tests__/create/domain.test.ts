import { canPreviewDraft } from '../../src/features/create/domain/creationRules';
import {
  canCreateManualCard,
  shouldShowPaywall,
} from '../../src/features/create/domain/quota';
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
