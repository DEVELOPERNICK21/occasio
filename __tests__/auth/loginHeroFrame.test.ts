import { heroFrame, HERO_SIZE } from '../../src/features/auth/ui/components/loginHeroFrame';

describe('heroFrame', () => {
  it.each([
    ['phone', 440, 956],
    ['small phone', 360, 640],
    ['tablet', 820, 1180],
  ])('always covers the %s screen left, right and top', (_name, width, height) => {
    for (const framing of ['couple', 'sky'] as const) {
      const frame = heroFrame(width, height, framing);

      expect(frame.left).toBeLessThanOrEqual(0);
      expect(frame.left + frame.width).toBeGreaterThanOrEqual(width);
      expect(frame.top).toBeLessThanOrEqual(0);
      expect(frame.width / frame.height).toBeCloseTo(HERO_SIZE.width / HERO_SIZE.height, 3);
    }
  });

  it('puts the couple in the upper half of a phone, above the brand block', () => {
    const { top, height, left, width } = heroFrame(440, 956, 'couple');
    const coupleY = top + 0.47 * height;
    const coupleX = left + 0.333 * width;

    expect(coupleY).toBeLessThan(956 * 0.4);
    expect(coupleX).toBeGreaterThan(440 * 0.3);
    expect(coupleX).toBeLessThan(440 * 0.7);
  });
});
