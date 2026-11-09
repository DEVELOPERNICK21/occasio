import { clamp01, sceneProgress } from './scroll';

describe('sceneProgress', () => {
  const viewport = 800;

  it('passes from 0 as an element enters at the bottom to 1 as it leaves at the top', () => {
    expect(sceneProgress('pass', 800, 400, viewport)).toBe(0);
    expect(sceneProgress('pass', 400, 400, viewport)).toBeCloseTo(1 / 3, 5);
    expect(sceneProgress('pass', -400, 400, viewport)).toBe(1);
  });

  it('never goes outside 0 to 1, however far the element is', () => {
    expect(sceneProgress('pass', 5000, 400, viewport)).toBe(0);
    expect(sceneProgress('pass', -5000, 400, viewport)).toBe(1);
    expect(sceneProgress('pin', 300, 2000, viewport)).toBe(0);
    expect(sceneProgress('pin', -5000, 2000, viewport)).toBe(1);
  });

  it('pins from the moment the element reaches the top to the moment its last screen does', () => {
    expect(sceneProgress('pin', 0, 2000, viewport)).toBe(0);
    expect(sceneProgress('pin', -600, 2000, viewport)).toBe(0.5);
    expect(sceneProgress('pin', -1200, 2000, viewport)).toBe(1);
  });

  it('copes with an element no taller than the screen', () => {
    expect(sceneProgress('pin', -10, 800, viewport)).toBe(1);
    expect(clamp01(Number.NaN)).toBe(0);
  });
});
