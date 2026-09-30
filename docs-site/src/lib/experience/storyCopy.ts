/**
 * Moment-aware story copy. Keep calm Occasio tone — no hype.
 */

/** Lamp headline: `lead` in the lamplight, `highlight` in gold, then a period. */
export type LampTitle = { lead: string; highlight: string };

export type StoryCopy = {
  lampTitle: (name: string) => LampTitle;
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

/** With a name the name is the gold word; without one, the moment's last word is. */
function lampTitle(
  leadWithName: string,
  leadNoName: string,
  highlightNoName: string,
): (name: string) => LampTitle {
  return (name) => {
    const trimmed = name.trim();
    return trimmed
      ? { lead: leadWithName, highlight: trimmed }
      : { lead: leadNoName, highlight: highlightNoName };
  };
}

const DEFAULT: StoryCopy = {
  lampTitle: lampTitle('Thinking of you,', 'Thinking of', 'you'),
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
    lampTitle: lampTitle('Happy birthday,', 'Happy', 'birthday'),
    balloonsTitle: 'Pop the balloons',
    candleTitle: (name) => `Blow the candles, ${name}`,
    candleSubLit: 'Make a wish, then tap the cake',
    candleSubOut: 'Wish made — beautifully',
    giftTitle: (name, open) =>
      open ? `Happy birthday, ${name}` : `A gift for ${name}`,
    giftSub: (open) =>
      open ? 'Something small, from the heart' : 'Tap to unwrap',
    reasonsTitle: 'Reasons you are loved',
    photosTitle: 'Birthday memories',
    photoCaptions: ['Happy birthday', 'This one', 'Your smile', 'Celebrate'],
  },
  anniversary: {
    lampTitle: lampTitle('Happy anniversary,', 'Happy', 'anniversary'),
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
    lampTitle: lampTitle('Thank you,', 'Thank', 'you'),
    balloonsTitle: 'A little thank-you',
    giftTitle: (name, open) =>
      open ? `Thank you, ${name}` : `For ${name}`,
    giftSub: (open) =>
      open ? 'It mattered — truly' : 'Tap to open',
    reasonsTitle: 'Reasons I am grateful',
    photosTitle: 'Moments that mattered',
    photoCaptions: ['Grateful', 'This one', 'Because of you', 'Thank you'],
    envelopeTitle: (name) => `A note for ${name}`,
    letterWriteTitle: 'With thanks',
  },
  congratulations: {
    lampTitle: lampTitle('Well done,', 'Well', 'done'),
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
    lampTitle: lampTitle('Thinking of you,', 'Thinking of', 'you'),
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
