import {
  REVIEW_NO_PHOTOS_COPY,
  buildIdempotencyKey,
  canApproveScheduledSend,
  canTransition,
  formatPhotoCountLabel,
  formatReviewDeadline,
  isReviewExpired,
  occasionLabel,
  resolveReviewPhotoCount,
  shouldAutoDispatchOnDeadline,
} from '../../src/features/vault/domain/scheduledSend';
import {
  packFromLinkedCreation,
  resolveAutoSendContent,
} from '../../src/features/vault/domain/contentFallback';

describe('scheduledSend', () => {
  it('builds stable idempotency keys', () => {
    expect(buildIdempotencyKey('u1', 'r1', 'birthday', 2026)).toBe(
      'u1_r1_birthday_2026',
    );
  });

  it('allows pending→review→approved→sent', () => {
    expect(canTransition('pending', 'review')).toBe(true);
    expect(canTransition('review', 'approved')).toBe(true);
    expect(canTransition('approved', 'sent')).toBe(true);
    expect(canTransition('cancelled', 'sent')).toBe(false);
  });

  it('auto-dispatches only with photos after deadline', () => {
    expect(shouldAutoDispatchOnDeadline(true, true)).toBe('dispatch');
    expect(shouldAutoDispatchOnDeadline(false, true)).toBe('incomplete_pack');
    expect(shouldAutoDispatchOnDeadline(true, false)).toBe('wait');
  });

  it('labels occasions without emoji', () => {
    expect(occasionLabel('birthday')).toBe('Birthday');
    expect(occasionLabel('anniversary')).toBe('Anniversary');
  });

  describe('formatReviewDeadline', () => {
    const deadline = '2026-09-13T12:00:00.000Z';

    it('counts hours left before the window ends', () => {
      expect(
        formatReviewDeadline(deadline, new Date('2026-09-13T08:00:00.000Z')),
      ).toBe('4 hours left to review');
    });

    it('uses a one-hour label', () => {
      expect(
        formatReviewDeadline(deadline, new Date('2026-09-13T11:00:00.000Z')),
      ).toBe('1 hour left to review');
    });

    it('marks an ended window', () => {
      expect(
        formatReviewDeadline(deadline, new Date('2026-09-13T13:00:00.000Z')),
      ).toBe('Review window ended');
    });
  });

  describe('review photo heuristic', () => {
    it('disables approve only when pack photos are known empty', () => {
      expect(
        canApproveScheduledSend(
          resolveReviewPhotoCount({
            packPhotoCount: 0,
            lastCreationId: null,
            shareUrl: null,
            generatedCreationId: null,
          }),
        ),
      ).toBe(false);
      expect(formatPhotoCountLabel(0)).toBe('No photos on this card yet');
      expect(REVIEW_NO_PHOTOS_COPY).toBe(
        'Add photos via Save for auto-send or cancel',
      );
    });

    it('uses pack photo count when present', () => {
      expect(
        resolveReviewPhotoCount({
          packPhotoCount: 2,
          lastCreationId: null,
          shareUrl: null,
          generatedCreationId: null,
        }),
      ).toBe(2);
    });

    it('treats last-card or generated send as unknown and allows approve', () => {
      expect(
        resolveReviewPhotoCount({
          packPhotoCount: 0,
          lastCreationId: 'c1',
          shareUrl: null,
          generatedCreationId: null,
        }),
      ).toBeNull();
      expect(
        canApproveScheduledSend(
          resolveReviewPhotoCount({
            packPhotoCount: 0,
            lastCreationId: null,
            shareUrl: 'https://example.com/c/x',
            generatedCreationId: null,
          }),
        ),
      ).toBe(true);
      expect(
        canApproveScheduledSend(
          resolveReviewPhotoCount({
            packPhotoCount: 0,
            lastCreationId: null,
            shareUrl: null,
            generatedCreationId: 'cr_1',
          }),
        ),
      ).toBe(true);
    });

    it('allows approve when photo count is unknown', () => {
      expect(
        canApproveScheduledSend(
          resolveReviewPhotoCount({
            shareUrl: null,
            generatedCreationId: null,
          }),
        ),
      ).toBe(true);
    });
  });

  describe('isReviewExpired', () => {
    const deadline = '2026-09-13T12:00:00.000Z';

    it('returns false when now is before deadline', () => {
      expect(
        isReviewExpired(deadline, new Date('2026-09-13T11:00:00.000Z')),
      ).toBe(false);
    });

    it('returns false when now equals deadline', () => {
      expect(
        isReviewExpired(deadline, new Date('2026-09-13T12:00:00.000Z')),
      ).toBe(false);
    });

    it('returns true when now is after deadline', () => {
      expect(
        isReviewExpired(deadline, new Date('2026-09-13T13:00:00.000Z')),
      ).toBe(true);
    });
  });
});

describe('contentFallback', () => {
  it('prefers vault pack, then last creation, then default', () => {
    const pack = resolveAutoSendContent({
      occasionType: 'birthday',
      pack: {
        preferredTemplateType: 'birthday',
        preferredTemplateId: 't1',
        photoRefs: ['p1'],
        defaultMessage: 'Happy birthday',
        fromName: 'Nick',
      },
      lastCreation: null,
    });
    expect(pack.source).toBe('pack');

    const last = resolveAutoSendContent({
      occasionType: 'anniversary',
      pack: null,
      lastCreation: {
        templateType: 'anniversary',
        templateId: 't2',
        photoRefs: ['p2'],
        message: 'One more year',
        fromName: 'Nick',
      },
    });
    expect(last.source).toBe('last_creation');

    const fallback = resolveAutoSendContent({
      occasionType: 'birthday',
      pack: null,
      lastCreation: null,
    });
    expect(fallback.source).toBe('default');
    expect(fallback.photoRefs).toEqual([]);
  });

  it('falls through to last_creation when pack has empty photoRefs', () => {
    const result = resolveAutoSendContent({
      occasionType: 'birthday',
      pack: {
        preferredTemplateType: 'birthday',
        preferredTemplateId: 't1',
        photoRefs: [],
        defaultMessage: 'Happy birthday',
        fromName: 'Nick',
      },
      lastCreation: {
        templateType: 'birthday',
        templateId: 't2',
        photoRefs: ['p2'],
        message: 'From last card',
        fromName: 'Nick',
      },
    });
    expect(result.source).toBe('last_creation');
    expect(result.photoRefs).toEqual(['p2']);
    expect(result.message).toBe('From last card');
  });

  it('copies a shared creation into a pack partial and lastCreation fields', () => {
    expect(
      packFromLinkedCreation({
        templateType: 'birthday',
        templateId: 'L01',
        photoRefs: ['uploads/a.jpg'],
        message: 'Happy birthday',
        fromName: 'Nick',
      }),
    ).toEqual({
      preferredTemplateType: 'birthday',
      preferredTemplateId: 'L01',
      photoRefs: ['uploads/a.jpg'],
      defaultMessage: 'Happy birthday',
      fromName: 'Nick',
    });
  });
});
