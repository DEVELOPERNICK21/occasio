import { STICKERS, pickSticker, starCapacity, tierFor } from './joy';

describe('joy stars', () => {
  it('sums capacity from the scenes that exist', () => {
    const cap = starCapacity(['gate', 'lamp', 'balloons', 'candle', 'gift', 'hub', 'finale'], {
      reasons: 0,
      photos: 0,
    });
    // gate 1 + lamp 1 + balloons 4 + candle 4 + gift 4 + hub (letter room 1 + envelope 1 + letter 1)
    expect(cap).toBe(1 + 1 + 4 + 4 + 4 + 3);
  });

  it('counts reasons and photos only when those scenes are present, capped at 5', () => {
    const base = starCapacity(['hub'], { reasons: 0, photos: 0 });
    expect(starCapacity(['hub'], { reasons: 9, photos: 0 })).toBe(base + 1 + 5);
    expect(starCapacity(['hub'], { reasons: 0, photos: 3 })).toBe(base + 1 + 3);
    expect(starCapacity(['gate'], { reasons: 9, photos: 9 })).toBe(1);
  });

  it('never returns a zero capacity', () => {
    expect(starCapacity([], { reasons: 0, photos: 0 })).toBe(1);
  });

  it('maps completion to tiers', () => {
    expect(tierFor(2, 10)).toBe('bronze');
    expect(tierFor(6, 10)).toBe('silver');
    expect(tierFor(9, 10)).toBe('gold');
  });
});

describe('sticker rewards', () => {
  it('bronze play only ever gets commons', () => {
    for (let i = 0; i < 200; i += 1) {
      expect(pickSticker('birthday', 'bronze').rarity).toBe('common');
    }
  });

  it('gold play can reach a rare, and stays in the moment', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 400; i += 1) {
      const s = pickSticker('anniversary', 'gold');
      expect(s.moment).toBe('anniversary');
      seen.add(s.rarity);
    }
    expect(seen.has('rare')).toBe(true);
  });

  it('has a full set for every moment', () => {
    for (const moment of ['birthday', 'anniversary', 'thank_you', 'congratulations', 'just_because']) {
      const set = STICKERS.filter((s) => s.moment === moment);
      expect(set.some((s) => s.rarity === 'common')).toBe(true);
      expect(set.some((s) => s.rarity === 'rare')).toBe(true);
    }
  });
});
