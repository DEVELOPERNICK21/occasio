import { dateSpan, ordinal } from './dates';

describe('ordinal', () => {
  it('writes the ending the way people say it', () => {
    expect([1, 2, 3, 4, 10, 21, 22, 23, 24, 30, 31].map(ordinal)).toEqual([
      '1st',
      '2nd',
      '3rd',
      '4th',
      '10th',
      '21st',
      '22nd',
      '23rd',
      '24th',
      '30th',
      '31st',
    ]);
  });

  it('gives teen numbers a th, not st, nd or rd', () => {
    expect([11, 12, 13, 111, 112].map(ordinal)).toEqual(['11th', '12th', '13th', '111th', '112th']);
  });
});

describe('dateSpan', () => {
  it('writes one day on its own', () => {
    expect(dateSpan('2027-02-23')).toBe('23rd February 2027');
    expect(dateSpan('2027-02-23', '2027-02-23')).toBe('23rd February 2027');
  });

  it('joins several days of one month', () => {
    expect(dateSpan('2027-02-23', '2027-02-27')).toBe('23rd - 27th February 2027');
  });

  it('names both months when it crosses one, and both years when it crosses a year', () => {
    expect(dateSpan('2027-02-28', '2027-03-02')).toBe('28th February - 2nd March 2027');
    expect(dateSpan('2027-12-30', '2028-01-02')).toBe('30th December 2027 - 2nd January 2028');
  });

  it('falls back to the first day when the last is not a day, and to nothing when the first is not', () => {
    expect(dateSpan('2027-02-23', 'soon')).toBe('23rd February 2027');
    expect(dateSpan('soon')).toBe('');
  });
});
