/**
 * Moment-aware story copy. Keep calm Occasio tone — no hype.
 */

export type StoryCopy = {
  balloonsTitle: string;
  balloonsSub: string;
  candleTitle: (name: string) => string;
  candleSubLit: string;
  candleSubOut: string;
  giftTitle: (name: string, open: boolean) => string;
  giftSub: (open: boolean) => string;
  reasonsTitle: string;
  reasonsSub: string;
  photosTitle: string;
  photoCaptions: string[];
  envelopeTitle: (name: string) => string;
  letterWriteTitle: string;
};

const DEFAULT: StoryCopy = {
  balloonsTitle: 'Pop the balloons',
  balloonsSub: 'One tap at a time',
  candleTitle: (name) => `Blow the candles, ${name}`,
  candleSubLit: 'Make a wish, then tap the cake',
  candleSubOut: 'Wish made — beautifully',
  giftTitle: (name, open) => (open ? `For ${name}` : `A gift for ${name}`),
  giftSub: (open) => (open ? 'A little joy, just for you' : 'Tap to unwrap'),
  reasonsTitle: 'A few reasons',
  reasonsSub: 'Tap each one',
  photosTitle: 'Sweet moments',
  photoCaptions: ['A quiet smile', 'This one', 'Remember this', 'Us'],
  envelopeTitle: (name) => `A letter for ${name}`,
  letterWriteTitle: 'A letter for you',
};

const BY_MOMENT: Record<string, Partial<StoryCopy>> = {
  birthday: {
    balloonsTitle: 'Pop the balloons',
    candleTitle: (name) => `Blow the candles, ${name}`,
    candleSubLit: 'Make a wish, then tap the cake',
    candleSubOut: 'Wish made — beautifully',
    // The banner already spells the wish, so the title is the surprise itself.
    giftTitle: (name, open) =>
      open ? `Surprise, ${name}` : `A gift for ${name}`,
    giftSub: (open) =>
      open ? 'Something small, from the heart' : 'Tap to unwrap',
    reasonsTitle: 'Reasons you are loved',
    photosTitle: 'Birthday memories',
    photoCaptions: ['Happy birthday', 'This one', 'Your smile', 'Celebrate'],
  },
  anniversary: {
    balloonsTitle: 'Pop for us',
    candleTitle: (name) => `A wish for you both, ${name}`,
    candleSubLit: 'Tap the cake — for another year',
    candleSubOut: 'Here’s to more years',
    giftTitle: (name, open) =>
      open ? `For you, ${name}` : `Something for ${name}`,
    giftSub: (open) =>
      open ? 'A chapter you share' : 'Tap to unwrap',
    reasonsTitle: 'Everything I love about you',
    photosTitle: 'Our chapter',
    photoCaptions: ['Still us', 'This day', 'Together', 'Always'],
    envelopeTitle: (name) => `Written for ${name}`,
  },
  thank_you: {
    balloonsTitle: 'A little thank-you',
    giftTitle: (name, open) =>
      open ? `Because of you, ${name}` : `For ${name}`,
    giftSub: (open) =>
      open ? 'It mattered — truly' : 'Tap to open',
    reasonsTitle: 'Reasons I am grateful',
    photosTitle: 'Moments that mattered',
    photoCaptions: ['Grateful', 'This one', 'Because of you', 'Thank you'],
    envelopeTitle: (name) => `A note for ${name}`,
    letterWriteTitle: 'With thanks',
  },
  congratulations: {
    balloonsTitle: 'Celebrate with a pop',
    giftTitle: (name, open) =>
      open ? `Well done, ${name}` : `A gift for ${name}`,
    giftSub: (open) =>
      open ? 'You earned this moment' : 'Tap to unwrap',
    reasonsTitle: 'Why we are proud',
    photosTitle: 'Worth celebrating',
    photoCaptions: ['You did it', 'Proud', 'This win', 'Cheers'],
    envelopeTitle: (name) => `For ${name}`,
    letterWriteTitle: 'A note of pride',
  },
  just_because: {
    balloonsTitle: 'Just because',
    giftTitle: (name, open) =>
      open ? `For ${name}` : `A small surprise`,
    giftSub: (open) =>
      open ? 'No reason needed' : 'Tap to unwrap',
    photosTitle: 'Little memories',
    photoCaptions: ['Just this', 'Thinking of you', 'A smile', 'Always'],
    envelopeTitle: (name) => `For ${name}`,
    letterWriteTitle: 'A quiet note',
  },
};

export function storyCopyFor(templateType: string): StoryCopy {
  const overlay = BY_MOMENT[templateType] ?? {};
  return { ...DEFAULT, ...overlay };
}
