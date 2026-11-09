import { REVEAL_AT, SAMPLE_STEP, foilLeft, heartPath, isRevealed, scratchedShare } from './scratch';

/** RGBA pixels with the given alpha values. */
function pixels(alphas: number[]): Uint8ClampedArray {
  const data = new Uint8ClampedArray(alphas.length * 4);
  alphas.forEach((alpha, i) => {
    data[i * 4 + 3] = alpha;
  });
  return data;
}

describe('foilLeft', () => {
  it('counts the pixels that still hold foil, and ignores the ones scratched clear', () => {
    expect(foilLeft(pixels([255, 255, 0, 0, 255, 10]), 1)).toBe(3);
    expect(foilLeft(pixels([0, 0, 0]), 1)).toBe(0);
  });

  it('samples every Nth pixel only, so a big canvas is quick to read', () => {
    const all = pixels(Array.from({ length: 600 }, () => 255));
    expect(foilLeft(all, SAMPLE_STEP)).toBe(100);
    expect(foilLeft(all, 1)).toBe(600);
  });

  it('copes with nothing to read', () => {
    expect(foilLeft(new Uint8ClampedArray(0))).toBe(0);
  });
});

describe('scratchedShare', () => {
  it('is the share of the foil that has gone', () => {
    expect(scratchedShare(200, 200)).toBe(0);
    expect(scratchedShare(200, 100)).toBe(0.5);
    expect(scratchedShare(200, 0)).toBe(1);
  });

  it('never leaves 0 to 1, and counts a card with no foil as scratched', () => {
    expect(scratchedShare(100, 250)).toBe(0);
    expect(scratchedShare(0, 0)).toBe(1);
    expect(scratchedShare(-5, 3)).toBe(1);
  });
});

describe('isRevealed', () => {
  it('needs more than half of the foil gone, not all of it', () => {
    expect(REVEAL_AT).toBeGreaterThan(0.4);
    expect(REVEAL_AT).toBeLessThan(0.7);
    expect(isRevealed(0.3)).toBe(false);
    expect(isRevealed(REVEAL_AT)).toBe(true);
    expect(isRevealed(0.9)).toBe(true);
  });
});

describe('heartPath', () => {
  it('draws a closed shape that stays inside its box', () => {
    const path = heartPath(200, 180);
    expect(path.startsWith('M 100.0 171.0')).toBe(true);
    expect(path.endsWith('Z')).toBe(true);
    const numbers = (path.match(/-?\d+\.\d/g) ?? []).map(Number);
    expect(Math.max(...numbers)).toBeLessThanOrEqual(200);
    expect(Math.min(...numbers)).toBeGreaterThanOrEqual(0);
  });

  it('keeps enough precision for a unit box when asked', () => {
    const unit = heartPath(1, 1, 4);
    expect(unit.startsWith('M 0.5000 0.9500')).toBe(true);
    expect(heartPath(1, 1)).not.toBe(unit);
  });

  it('scales with the box', () => {
    expect(heartPath(100, 100)).not.toBe(heartPath(200, 200));
    expect(heartPath(100, 100)).toBe(heartPath(100, 100));
  });
});
