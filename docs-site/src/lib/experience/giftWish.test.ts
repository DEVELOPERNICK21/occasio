import {
  MAX_ROW,
  flagColors,
  flagLayout,
  wishRows,
  wishText,
} from './giftWish';

const MOMENTS = ['birthday', 'anniversary', 'thank_you', 'congratulations', 'just_because'];

function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const channel = (shift: number) => {
    const c = ((n >> shift) & 255) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(16) + 0.7152 * channel(8) + 0.0722 * channel(0);
}
const contrastWithWhite = (hex: string) => 1.05 / (luminance(hex) + 0.05);

describe('wish words', () => {
  it('spells the wish for every moment, on at most two ropes of readable length', () => {
    for (const moment of MOMENTS) {
      const rows = wishRows(moment);
      expect(rows.length).toBeGreaterThanOrEqual(1);
      expect(rows.length).toBeLessThanOrEqual(2);
      rows.forEach((word) => {
        expect(word).toMatch(/^[A-Z]+$/);
        expect(word.length).toBeLessThanOrEqual(MAX_ROW);
      });
    }
  });

  it('reads as a sentence for screen readers', () => {
    expect(wishText('birthday')).toBe('Happy birthday');
    expect(wishText('thank_you')).toBe('Thank you');
    expect(wishText('congratulations')).toBe('Congrats');
  });

  it('has a wish even for a moment it has never heard of', () => {
    expect(wishText('something_new')).toBe('Just because');
  });
});

describe('flag colours', () => {
  it('keeps white letters readable on every flag', () => {
    for (const moment of [...MOMENTS, 'unknown']) {
      for (const color of flagColors(moment)) {
        expect(contrastWithWhite(color)).toBeGreaterThanOrEqual(3);
      }
    }
  });
});

describe('flag layout', () => {
  it('makes one flag per letter, numbered across the whole banner', () => {
    const { flags } = flagLayout('birthday');
    expect(flags.map((f) => f.char).join('')).toBe('HAPPYBIRTHDAY');
    expect(flags.map((f) => f.order)).toEqual(flags.map((_, i) => i));
  });

  it('sizes every flag by the longest rope, so letters match across ropes', () => {
    expect(flagLayout('birthday').maxCount).toBe(8);
    expect(flagLayout('anniversary').maxCount).toBe(11);
    expect(flagLayout('congratulations').maxCount).toBe(8);
  });

  it('hangs flags square to a sagging rope: lean mirrors left to right and is level in the middle', () => {
    const { flags } = flagLayout('birthday');
    const rope = flags.filter((f) => f.row === 1);
    expect(rope).toHaveLength(8);
    rope.forEach((flag, i) => {
      const mirror = rope[rope.length - 1 - i]!;
      expect(flag.tilt).toBeCloseTo(-mirror.tilt, 1);
      expect(flag.drop).toBeCloseTo(mirror.drop, 1);
    });
    // Left flags lean clockwise (down toward the middle), right ones the other way.
    expect(rope[0]!.tilt).toBeGreaterThan(0);
    expect(rope[7]!.tilt).toBeLessThan(0);
  });

  it('hangs the middle lowest and the ends highest', () => {
    const rope = flagLayout('anniversary').flags.filter((f) => f.row === 1);
    const lowest = Math.max(...rope.map((f) => f.drop));
    expect(rope[5]!.drop).toBe(lowest);
    expect(rope[0]!.drop).toBeLessThan(lowest / 3);
  });

  it('keeps the lean gentle enough to read the letters', () => {
    for (const moment of MOMENTS) {
      for (const flag of flagLayout(moment).flags) {
        expect(Math.abs(flag.tilt)).toBeLessThanOrEqual(22);
      }
    }
  });

  it('colours flags in turn from the moment palette', () => {
    const { flags } = flagLayout('birthday');
    const palette = flagColors('birthday');
    flags.forEach((flag, i) => expect(flag.color).toBe(palette[i % palette.length]));
  });
});
