import { OPEN_THRESHOLD, pullProgress } from './useOpenGesture';

describe('pullProgress', () => {
  it('opens along the direction it is pulled, and not against it', () => {
    expect(pullProgress(-100, 0, { x: -1, y: 0 }, 200)).toBe(0.5);
    expect(pullProgress(100, 0, { x: -1, y: 0 }, 200)).toBe(0);
    expect(pullProgress(0, -100, { x: 0, y: -1 }, 200)).toBe(0.5);
  });

  it('counts a pull in any direction when none is given', () => {
    expect(pullProgress(30, 40, null, 100)).toBe(0.5);
    expect(pullProgress(-30, -40, null, 100)).toBe(0.5);
  });

  it('never goes outside 0 to 1, and copes with a zero distance', () => {
    expect(pullProgress(-900, 0, { x: -1, y: 0 }, 200)).toBe(1);
    expect(pullProgress(5, 5, null, 0)).toBe(1);
  });

  it('carries on by itself after a third of the pull', () => {
    expect(OPEN_THRESHOLD).toBeGreaterThan(0.25);
    expect(OPEN_THRESHOLD).toBeLessThan(0.5);
  });
});
