import { PIP_SPOTS, pipLine, type PipSpot } from '../../src/shared/mascot/pipSpots';

const SPOTS = Object.keys(PIP_SPOTS) as PipSpot[];

describe('Pip spots', () => {
  it('gives every spot a few lines to say, so tapping never repeats at once', () => {
    for (const spot of SPOTS) {
      expect(PIP_SPOTS[spot].lines.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('keeps Pip calm: short lines, no hype, no emoji, no exclamation marks', () => {
    for (const spot of SPOTS) {
      for (const line of PIP_SPOTS[spot].lines) {
        expect(line.length).toBeLessThanOrEqual(48);
        expect(line).not.toMatch(/!/);
        expect(line).not.toMatch(/\p{Extended_Pictographic}/u);
        expect(line).not.toMatch(/amazing|awesome|incredible|best ever/i);
        expect(line.trim()).toBe(line);
      }
    }
  });

  it('never makes Pip look sad or cheeky at the person: errors are surprised, not guilt-tripping', () => {
    for (const spot of SPOTS) {
      expect(PIP_SPOTS[spot].mood).not.toBe('cry');
      expect(PIP_SPOTS[spot].tapMood).not.toBe('cry');
    }
  });

  it('is not used anywhere near money, a "no", or leaving', () => {
    const forbidden = ['paywall', 'subscription', 'deleteAccount', 'ageBlocked', 'cancel'];
    for (const spot of SPOTS) {
      expect(forbidden.some((word) => spot.toLowerCase().includes(word.toLowerCase()))).toBe(false);
    }
  });

  it('says the lines in order and wraps round', () => {
    const lines = PIP_SPOTS.vaultEmpty.lines;
    expect(pipLine('vaultEmpty', 0)).toBe(lines[0]);
    expect(pipLine('vaultEmpty', 1)).toBe(lines[1]);
    expect(pipLine('vaultEmpty', lines.length)).toBe(lines[0]);
    expect(pipLine('vaultEmpty', -1)).toBe(lines[lines.length - 1]);
  });

  it("fills in the person's name, and falls back to 'them' when there is none", () => {
    expect(pipLine('shareReady', 0, 'Maya')).toBe('It is ready. Send it to Maya.');
    expect(pipLine('shareReady', 0, '  ')).toBe('It is ready. Send it to them.');
    expect(pipLine('shareReady', 0)).not.toContain('{name}');
  });
});
