import {
  ageOn,
  isOldEnough,
  MINIMUM_AGE,
  parseDateOfBirth,
} from '../../src/features/age/domain/ageGate';

const NOW = new Date(2026, 9, 8, 15, 0); // 8 Oct 2026, local

describe('age gate — date of birth parsing', () => {
  it('accepts a real date', () => {
    expect(parseDateOfBirth({ day: '14', month: '08', year: '1995' }, NOW)).toEqual({
      year: 1995,
      month: 8,
      day: 14,
    });
  });

  it('rejects impossible, future and malformed dates', () => {
    const bad = [
      { day: '31', month: '04', year: '2000' },
      { day: '29', month: '02', year: '2001' },
      { day: '00', month: '01', year: '2000' },
      { day: '01', month: '13', year: '2000' },
      { day: '09', month: '10', year: '2026' },
      { day: '01', month: '01', year: '1800' },
      { day: '01', month: '01', year: '99' },
      { day: 'ab', month: '01', year: '2000' },
      { day: '', month: '', year: '' },
    ];
    for (const input of bad) {
      expect(parseDateOfBirth(input, NOW)).toBeNull();
    }
  });
});

describe('age gate — the 13 threshold', () => {
  const dob = (year: number, month: number, day: number) => ({ year, month, day });

  it('lets in someone turning 13 today and keeps out someone turning 13 tomorrow', () => {
    expect(isOldEnough(dob(2013, 10, 8), NOW)).toBe(true);
    expect(isOldEnough(dob(2013, 10, 9), NOW)).toBe(false);
    expect(ageOn(dob(2013, 10, 9), NOW)).toBe(12);
  });

  it('treats adults as old enough and young children as not', () => {
    expect(isOldEnough(dob(1990, 5, 5), NOW)).toBe(true);
    expect(isOldEnough(dob(2020, 5, 5), NOW)).toBe(false);
  });

  it('matches the server minimum', () => {
    expect(MINIMUM_AGE).toBe(13);
  });
});
