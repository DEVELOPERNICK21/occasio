import {
  PURGE_GRACE_DAYS,
  shouldPurge,
  TAKEDOWN_RETAIN_DAYS,
} from '../../functions/src/purgeExpired';

const DAY = 86_400_000;
const NOW = new Date('2026-10-09T00:00:00Z');
const ago = (days: number) => new Date(NOW.getTime() - days * DAY);

describe('expired card purge', () => {
  it('keeps live cards and recently expired ones', () => {
    expect(shouldPurge({ expiresAt: new Date(NOW.getTime() + DAY), takedownAt: null }, NOW)).toBe(false);
    expect(shouldPurge({ expiresAt: ago(PURGE_GRACE_DAYS - 1), takedownAt: null }, NOW)).toBe(false);
  });

  it('deletes cards once the grace period after expiry has passed', () => {
    expect(shouldPurge({ expiresAt: ago(PURGE_GRACE_DAYS), takedownAt: null }, NOW)).toBe(true);
    expect(shouldPurge({ expiresAt: ago(60), takedownAt: null }, NOW)).toBe(true);
  });

  it('never deletes a card with no expiry date', () => {
    expect(shouldPurge({ expiresAt: null, takedownAt: null }, NOW)).toBe(false);
  });

  it('keeps taken-down cards long enough to honour a counter-notice', () => {
    const expired = ago(30);
    expect(shouldPurge({ expiresAt: expired, takedownAt: ago(5) }, NOW)).toBe(false);
    expect(shouldPurge({ expiresAt: expired, takedownAt: ago(TAKEDOWN_RETAIN_DAYS - 1) }, NOW)).toBe(false);
    expect(shouldPurge({ expiresAt: expired, takedownAt: ago(TAKEDOWN_RETAIN_DAYS) }, NOW)).toBe(true);
  });
});
