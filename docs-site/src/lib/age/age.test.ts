import { ageOn, checkDate, isOldEnough, MINIMUM_AGE, parseDateOfBirth } from './ageGate';
import {
  ATTESTATION_MAX_AGE_MS,
  createAttestation,
  verifyAttestation,
} from './attestation';

const SECRET = 'a-test-secret-that-is-at-least-32-characters-long';
const NOW = new Date('2026-10-08T10:00:00.000Z');

describe('parseDateOfBirth', () => {
  it('accepts a real date given as numbers or digit strings', () => {
    expect(parseDateOfBirth({ year: 2000, month: 2, day: 29 }, NOW)).toEqual({ year: 2000, month: 2, day: 29 });
    expect(parseDateOfBirth({ year: '1999', month: '12', day: '31' }, NOW)).toEqual({ year: 1999, month: 12, day: 31 });
  });

  it('rejects dates that do not exist', () => {
    expect(parseDateOfBirth({ year: 2001, month: 2, day: 29 }, NOW)).toBeNull();
    expect(parseDateOfBirth({ year: 2000, month: 4, day: 31 }, NOW)).toBeNull();
    expect(parseDateOfBirth({ year: 2000, month: 13, day: 1 }, NOW)).toBeNull();
    expect(parseDateOfBirth({ year: 2000, month: 0, day: 1 }, NOW)).toBeNull();
    expect(parseDateOfBirth({ year: 2000, month: 1, day: 0 }, NOW)).toBeNull();
  });

  it('rejects the future, the implausibly old, and non-numeric input', () => {
    expect(parseDateOfBirth({ year: 2026, month: 10, day: 9 }, NOW)).toBeNull();
    expect(parseDateOfBirth({ year: 2999, month: 1, day: 1 }, NOW)).toBeNull();
    expect(parseDateOfBirth({ year: 1850, month: 1, day: 1 }, NOW)).toBeNull();
    expect(parseDateOfBirth({ year: 'abcd', month: 1, day: 1 }, NOW)).toBeNull();
    expect(parseDateOfBirth({ year: '2000.5', month: 1, day: 1 }, NOW)).toBeNull();
    expect(parseDateOfBirth({ year: null, month: 1, day: 1 }, NOW)).toBeNull();
    expect(parseDateOfBirth(null, NOW)).toBeNull();
    expect(parseDateOfBirth(undefined, NOW)).toBeNull();
  });
});

describe('age threshold (13)', () => {
  const dob = (year: number, month: number, day: number) => ({ year, month, day });

  it('is exactly 13 on the 13th birthday and 12 the day before', () => {
    expect(ageOn(dob(2013, 10, 8), NOW)).toBe(13);
    expect(isOldEnough(dob(2013, 10, 8), NOW)).toBe(true);
    expect(ageOn(dob(2013, 10, 9), NOW)).toBe(12);
    expect(isOldEnough(dob(2013, 10, 9), NOW)).toBe(false);
  });

  it('handles earlier and later months of the same year', () => {
    expect(isOldEnough(dob(2013, 1, 1), NOW)).toBe(true);
    expect(isOldEnough(dob(2013, 12, 31), NOW)).toBe(false);
  });

  it('treats a leap-day birthday correctly in a non-leap year', () => {
    const feb29 = dob(2012, 2, 29);
    expect(ageOn(feb29, new Date('2025-02-28T12:00:00Z'))).toBe(12);
    expect(ageOn(feb29, new Date('2025-03-01T12:00:00Z'))).toBe(13);
  });

  it('uses 13 as the minimum', () => {
    expect(MINIMUM_AGE).toBe(13);
  });
});

describe('age attestation', () => {
  it('verifies a token it just created', () => {
    expect(verifyAttestation(createAttestation(SECRET, NOW), SECRET, NOW)).toBe(true);
  });

  it('carries no birthday or identity', () => {
    const payload = Buffer.from(createAttestation(SECRET, NOW).split('.')[0]!, 'base64url').toString();
    expect(Object.keys(JSON.parse(payload)).sort()).toEqual(['iat', 'min', 'v']);
  });

  it('rejects a wrong secret, a tampered payload and a tampered signature', () => {
    const token = createAttestation(SECRET, NOW);
    expect(verifyAttestation(token, 'another-secret-that-is-also-32-chars-long!!', NOW)).toBe(false);

    const [payload, sig] = token.split('.') as [string, string];
    const forged = Buffer.from(JSON.stringify({ v: 1, min: 1, iat: Math.floor(NOW.getTime() / 1000) })).toString('base64url');
    expect(verifyAttestation(`${forged}.${sig}`, SECRET, NOW)).toBe(false);
    expect(verifyAttestation(`${payload}.${sig.slice(0, -2)}AA`, SECRET, NOW)).toBe(false);
  });

  it('rejects garbage and non-strings', () => {
    for (const bad of ['', 'abc', 'a.b.c', '.', null, undefined, 42, {}, 'x'.repeat(600)]) {
      expect(verifyAttestation(bad, SECRET, NOW)).toBe(false);
    }
  });

  it('expires after 180 days and is not valid before it was issued', () => {
    const token = createAttestation(SECRET, NOW);
    expect(verifyAttestation(token, SECRET, new Date(NOW.getTime() + ATTESTATION_MAX_AGE_MS - 1000))).toBe(true);
    expect(verifyAttestation(token, SECRET, new Date(NOW.getTime() + ATTESTATION_MAX_AGE_MS + 1000))).toBe(false);
    expect(verifyAttestation(token, SECRET, new Date(NOW.getTime() - 60 * 60 * 1000))).toBe(false);
  });
});

describe('time zones: the server never refuses someone their own calendar accepts', () => {
  // 13th birthday on 9 Oct 2026, checked at 18:50 UTC on 8 Oct: it is already 9 Oct in India (UTC+5:30).
  const lateUtc = new Date('2026-10-08T18:50:00Z');
  const bornToday = { year: 2013, month: 10, day: 9 };

  it('UTC alone would have refused them; the lenient check lets them in', () => {
    expect(isOldEnough(bornToday, lateUtc)).toBe(false);
    expect(isOldEnough(bornToday, checkDate(lateUtc))).toBe(true);
    expect(parseDateOfBirth({ year: 2026, month: 10, day: 9 }, checkDate(lateUtc))).not.toBeNull();
  });

  it('is still strict for anyone who is genuinely younger by more than a day', () => {
    expect(isOldEnough({ year: 2013, month: 10, day: 11 }, checkDate(lateUtc))).toBe(false);
    expect(isOldEnough({ year: 2013, month: 12, day: 25 }, checkDate(lateUtc))).toBe(false);
  });
});
