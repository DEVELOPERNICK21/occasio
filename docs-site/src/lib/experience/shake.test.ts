import { createShakeDetector, SHAKE_COOLDOWN_MS } from './shake';

const still = { x: 0.1, y: 0.2, z: 9.8 };
const jolt = (n: number) => ({ x: n * 14, y: -n * 11, z: 9.8 + n * 9 });

describe('createShakeDetector', () => {
  it('ignores a phone sitting still or being carried gently', () => {
    const detect = createShakeDetector();
    let now = 0;
    for (let i = 0; i < 200; i += 1) {
      now += 16;
      const wobble = { x: Math.sin(i / 9) * 1.5, y: Math.cos(i / 7) * 1.2, z: 9.8 + Math.sin(i / 5) };
      expect(detect(wobble, now)).toBe(false);
    }
  });

  it('needs a baseline reading first, so the very first sample never counts', () => {
    const detect = createShakeDetector();
    expect(detect(jolt(3), 0)).toBe(false);
  });

  it('fires once for a hard shake', () => {
    const detect = createShakeDetector();
    detect(still, 0);
    expect(detect(jolt(2), 16)).toBe(true);
  });

  it('counts one shake once, however many jolts it is made of', () => {
    const detect = createShakeDetector();
    detect(still, 0);
    let fired = 0;
    // A real shake is a burst of back-and-forth jolts over a few hundred ms.
    for (let i = 1; i <= 20; i += 1) {
      if (detect(jolt(i % 2 === 0 ? 2 : -2), i * 16)) fired += 1;
    }
    expect(fired).toBe(1);
  });

  it('counts a second shake after the pause', () => {
    const detect = createShakeDetector();
    detect(still, 0);
    expect(detect(jolt(2), 16)).toBe(true);
    detect(still, 100);
    expect(detect(jolt(2), 16 + SHAKE_COOLDOWN_MS + 20)).toBe(true);
  });

  it('skips samples that have no reading', () => {
    const detect = createShakeDetector();
    detect(still, 0);
    expect(detect({ x: null, y: null, z: null }, 16)).toBe(false);
    expect(detect(jolt(2), 32)).toBe(true);
  });

  it('can be made more or less sensitive', () => {
    const easy = createShakeDetector({ threshold: 5 });
    const hard = createShakeDetector({ threshold: 80 });
    easy(still, 0);
    hard(still, 0);
    const nudge = { x: 3, y: 3, z: 11 };
    expect(easy(nudge, 16)).toBe(true);
    expect(hard(nudge, 16)).toBe(false);
  });
});
