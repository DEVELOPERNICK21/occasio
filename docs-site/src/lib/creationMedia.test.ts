import { MAX_MESSAGE_CHARS, mediaViolation } from './creationMedia';
import { isDevRelaxedQuota } from './devQuota';
import { generateShareSlug, SHARE_SLUG_LENGTH } from './shareSlug';
import { isRateLimited, rateLimit, resetRateLimits } from './rateLimit';

const BUCKET = 'occasio-app-dev.firebasestorage.app';
const PNG = 'data:image/png;base64,iVBORw0KGgo=';

function check(overrides: Partial<Parameters<typeof mediaViolation>[0]> = {}) {
  return mediaViolation({
    photoRefs: ['uploads/u1/a.jpg'],
    mediaUrls: [],
    uid: 'u1',
    bucket: BUCKET,
    ...overrides,
  });
}

describe('card media rules', () => {
  it('accepts a photo in the caller own folder', () => {
    expect(check()).toBeNull();
  });

  it('accepts inline photos with matching data URLs', () => {
    expect(check({ photoRefs: ['inline:0'], mediaUrls: [PNG] })).toBeNull();
  });

  it('rejects a photo from somebody else folder', () => {
    expect(check({ photoRefs: ['uploads/other/a.jpg'] })).toMatch(/does not belong/);
  });

  it('keeps an older shared-folder photo only when the card already had it', () => {
    const ref = 'uploads/guest/old.jpg';
    expect(check({ photoRefs: [ref] })).toMatch(/does not belong/);
    expect(check({ photoRefs: [ref], existingRefs: [ref] })).toBeNull();
  });

  it('rejects path tricks and unknown reference shapes', () => {
    expect(check({ photoRefs: ['uploads/u1/../other/a.jpg'] })).toMatch(/Invalid photo/);
    expect(check({ photoRefs: ['https://evil.example/a.jpg'] })).toMatch(/Invalid photo/);
  });

  it('rejects image URLs that are not embedded images or our own Storage', () => {
    expect(check({ mediaUrls: ['https://evil.example/a.jpg'] })).toMatch(/Invalid image/);
    expect(check({ mediaUrls: ['javascript:alert(1)'] })).toMatch(/Invalid image/);
    expect(check({ mediaUrls: ['data:text/html;base64,PHNjcmlwdD4='] })).toMatch(/Invalid image/);
    expect(check({ mediaUrls: ['data:image/svg+xml;base64,PHN2Zz4='] })).toMatch(/Invalid image/);
    expect(
      check({
        mediaUrls: [
          `https://firebasestorage.googleapis.com/v0/b/other-bucket/o/uploads%2Fu1%2Fa.jpg?alt=media`,
        ],
      }),
    ).toMatch(/Invalid image/);
  });

  it('accepts a link into our own bucket', () => {
    expect(
      check({
        mediaUrls: [
          `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/uploads%2Fu1%2Fa.jpg?alt=media`,
        ],
      }),
    ).toBeNull();
  });

  it('rejects an oversized embedded photo', () => {
    const big = `data:image/png;base64,${'A'.repeat(170_000)}`;
    expect(check({ photoRefs: ['inline:0'], mediaUrls: [big] })).toMatch(/too large/);
  });

  it('allows the same message length the app allows', () => {
    expect(MAX_MESSAGE_CHARS).toBe(280);
  });
});

describe('dev quota bypass', () => {
  it('is off by default and in production', () => {
    expect(isDevRelaxedQuota(false, {})).toBe(false);
    expect(isDevRelaxedQuota(true, { NODE_ENV: 'production' })).toBe(false);
  });

  it('ignores a client request unless the server allows it', () => {
    expect(isDevRelaxedQuota(true, { NODE_ENV: 'production' })).toBe(false);
    expect(
      isDevRelaxedQuota(true, { NODE_ENV: 'production', OCCASIO_ALLOW_DEV_CREATE: 'true' }),
    ).toBe(true);
    expect(
      isDevRelaxedQuota(false, { NODE_ENV: 'production', OCCASIO_ALLOW_DEV_CREATE: 'true' }),
    ).toBe(false);
  });

  it('stays off in next-dev unless a server flag is set', () => {
    expect(isDevRelaxedQuota(false, { NODE_ENV: 'development' })).toBe(false);
    expect(isDevRelaxedQuota(false, { OCCASIO_DEV_RELAXED_QUOTA: 'true' })).toBe(true);
    expect(isDevRelaxedQuota(false, { OCCASIO_DEV_RELAXED_QUOTA: 'false' })).toBe(false);
  });
});

describe('share slugs', () => {
  it('are long enough to resist guessing and only use a-z and 0-9', () => {
    expect(SHARE_SLUG_LENGTH).toBe(12);
    const slugs = new Set(Array.from({ length: 200 }, () => generateShareSlug()));
    expect(slugs.size).toBe(200);
    for (const slug of slugs) {
      expect(slug).toMatch(/^[a-z0-9]{12}$/);
    }
  });
});

describe('rate limit peek', () => {
  beforeEach(resetRateLimits);

  it('reports a spent quota without counting itself', () => {
    const now = 1_000;
    expect(isRateLimited('k', 2, 1000, now)).toBe(false);
    rateLimit('k', 2, 1000, now);
    rateLimit('k', 2, 1000, now);
    expect(isRateLimited('k', 2, 1000, now)).toBe(true);
    expect(isRateLimited('k', 2, 1000, now + 2000)).toBe(false);
  });
});
