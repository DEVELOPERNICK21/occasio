import { fitNameSize } from './typography';

describe('fitNameSize', () => {
  it('makes a short name large and a long one smaller', () => {
    const short = fitNameSize('Ana', 330, 24, 46);
    const long = fitNameSize('Alexandria & Bartholomew', 330, 24, 46);
    expect(short).toBe(46);
    expect(long).toBeLessThan(short);
  });

  it('never leaves its bounds', () => {
    expect(fitNameSize('x'.repeat(200), 330, 24, 46)).toBe(24);
    expect(fitNameSize('', 330, 24, 46)).toBe(46);
  });

  it('counts a letter outside the basic alphabet as one letter', () => {
    expect(fitNameSize('प्रिया', 330, 10, 80)).toBe(fitNameSize('abcdef', 330, 10, 80));
  });
});
