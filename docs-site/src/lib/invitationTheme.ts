import { DEFAULT_DESIGN, type InvitationDesign, type Occasion } from './invitation';

/**
 * How each occasion looks and what its small games are called. Pure data, shared by the invitation
 * page, the link-preview image and their tests, so a wedding is never a birthday by accident.
 *
 * Two families share one engine: `regal` (doors, marigolds, lamps) for the ceremonies, and `party`
 * (balloons, confetti, stars) for everything lighter.
 */

export type Family = 'regal' | 'party';

/** Which set of artwork and which entrance an invitation uses. `party` is the one look of every non-ceremony. */
export type Look = InvitationDesign | 'party';

export type Palette = {
  /** The page. */
  bg: string;
  /** Cards and the pass. */
  paper: string;
  /** Buttons and headings: carries white text. */
  primary: string;
  primaryDeep: string;
  /** Rules and borders. */
  accent: string;
  accentSoft: string;
  /** The bright note: flowers, flames, the second colour. */
  pop: string;
  alert: string;
  ink: string;
  muted: string;
  confetti: string[];
};

export type Copy = {
  gateEyebrow: string;
  gateHint: string;
  /** "lamp" or "star": what a guest collects, one per event. */
  token: string;
  tokens: string;
  /** What the guest does to it, and how they take it back: "Light" and "Put out". */
  tokenDo: string;
  tokenUndo: string;
  tokenIntro: string;
  tokenDone: string;
  showerHint: string;
  passTitle: string;
};

export type InvitationTheme = {
  family: Family;
  look: Look;
  palette: Palette;
  copy: Copy;
};

const REGAL_COPY: Copy = {
  gateEyebrow: 'You are invited',
  gateHint: 'Honk to start the baraat',
  token: 'garland',
  tokens: 'garlands',
  tokenDo: 'Hang',
  tokenUndo: 'Take down',
  tokenIntro: 'Honk at each stop to hang a garland over the car',
  tokenDone: 'The car is dressed in marigolds. Thank you for being part of this.',
  showerHint: 'Tap the car to honk',
  passTitle: 'Baraat pass',
};

const PARTY_COPY: Copy = {
  gateEyebrow: 'You are invited',
  gateHint: 'Tap the balloon',
  token: 'star',
  tokens: 'stars',
  tokenDo: 'Collect',
  tokenUndo: 'Return',
  tokenIntro: 'Collect a star for each plan',
  tokenDone: 'Every star is yours. See you there.',
  showerHint: 'Tap the photo for confetti',
  passTitle: 'Party pass',
};

const MARIGOLD_CONFETTI = ['#F29A1F', '#F6C945', '#E36F8F', '#A3231B', '#FFF3D6'];

export const THEMES: Record<Occasion, InvitationTheme> = {
  wedding: {
    family: 'regal',
    look: 'regal',
    copy: REGAL_COPY,
    palette: {
      bg: '#fbf4e4',
      paper: '#fffbf1',
      primary: '#1f4d3a',
      primaryDeep: '#123626',
      accent: '#bf9335',
      accentSoft: '#e7d3a0',
      pop: '#f29a1f',
      alert: '#a3231b',
      ink: '#2b2118',
      muted: '#6e6250',
      confetti: MARIGOLD_CONFETTI,
    },
  },
  engagement: {
    family: 'regal',
    look: 'regal',
    copy: REGAL_COPY,
    palette: {
      bg: '#fcf1e6',
      paper: '#fffaf3',
      primary: '#7a2230',
      primaryDeep: '#4d1320',
      accent: '#bf9335',
      accentSoft: '#ecd5b0',
      pop: '#e9822b',
      alert: '#a3231b',
      ink: '#2e1c1a',
      muted: '#735d58',
      confetti: ['#E9822B', '#F6C945', '#E36F8F', '#7A2230', '#FFF3D6'],
    },
  },
  anniversary: {
    family: 'regal',
    look: 'regal',
    copy: REGAL_COPY,
    palette: {
      bg: '#f4f1ea',
      paper: '#fcfaf5',
      primary: '#1f3a5f',
      primaryDeep: '#12253f',
      accent: '#b8934a',
      accentSoft: '#e4d4ae',
      pop: '#e0a030',
      alert: '#9c2f2f',
      ink: '#1f2430',
      muted: '#5f6573',
      confetti: ['#E0A030', '#F3DFA0', '#B8934A', '#1F3A5F', '#FFFFFF'],
    },
  },
  birthday: {
    family: 'party',
    look: 'party',
    copy: PARTY_COPY,
    palette: {
      bg: '#fff6ea',
      paper: '#fffdf8',
      primary: '#c8431c',
      primaryDeep: '#8f2c10',
      accent: '#f2b01e',
      accentSoft: '#ffe3a3',
      pop: '#2a9d8f',
      alert: '#c8431c',
      ink: '#2b1d16',
      muted: '#6f5b4f',
      confetti: ['#E4572E', '#F2B01E', '#2A9D8F', '#F28CB1', '#4C6EF5'],
    },
  },
  baby_shower: {
    family: 'party',
    look: 'party',
    copy: PARTY_COPY,
    palette: {
      bg: '#f2f8f4',
      paper: '#fcfffd',
      primary: '#2f7d6a',
      primaryDeep: '#1f5848',
      accent: '#e9a58f',
      accentSoft: '#fbd9cb',
      pop: '#f2c14e',
      alert: '#d9674a',
      ink: '#1f2b27',
      muted: '#5a6b64',
      confetti: ['#E9A58F', '#F2C14E', '#8CC7B7', '#BFD8F2', '#FFFFFF'],
    },
  },
  housewarming: {
    family: 'party',
    look: 'party',
    copy: PARTY_COPY,
    palette: {
      bg: '#fbf1e6',
      paper: '#fffaf3',
      primary: '#b4532a',
      primaryDeep: '#7f3718',
      accent: '#d9a441',
      accentSoft: '#f2dca8',
      pop: '#3f7d6b',
      alert: '#b4532a',
      ink: '#2c1d14',
      muted: '#6e5a4c',
      confetti: ['#D9A441', '#B4532A', '#3F7D6B', '#F2DCA8', '#FFFFFF'],
    },
  },
  graduation: {
    family: 'party',
    look: 'party',
    copy: PARTY_COPY,
    palette: {
      bg: '#f6f4ee',
      paper: '#fffefa',
      primary: '#1c3557',
      primaryDeep: '#0f2240',
      accent: '#c9a227',
      accentSoft: '#efe0a6',
      pop: '#d8573a',
      alert: '#d8573a',
      ink: '#1b2230',
      muted: '#5b6372',
      confetti: ['#C9A227', '#D8573A', '#1C3557', '#EFE0A6', '#FFFFFF'],
    },
  },
  party: {
    family: 'party',
    look: 'party',
    copy: PARTY_COPY,
    palette: {
      bg: '#fff7ec',
      paper: '#fffdf8',
      primary: '#1f7a8c',
      primaryDeep: '#14596a',
      accent: '#f2a65a',
      accentSoft: '#fcd9b0',
      pop: '#e4572e',
      alert: '#e4572e',
      ink: '#1d2a2e',
      muted: '#586a6f',
      confetti: ['#E4572E', '#F2A65A', '#1F7A8C', '#F28CB1', '#FFD166'],
    },
  },
};

const SAGE_COPY: Copy = {
  gateEyebrow: 'You are invited',
  gateHint: 'Tap the seal to open',
  token: 'card',
  tokens: 'cards',
  tokenDo: 'Turn',
  tokenUndo: 'Turn back',
  tokenIntro: 'Turn each card to see the plan',
  tokenDone: 'Every card is turned. Thank you for being part of this.',
  showerHint: 'Tap the portrait for a shower of leaves',
  passTitle: 'Guest pass',
};

const PALACE_COPY: Copy = {
  gateEyebrow: 'You are invited',
  gateHint: 'Pull a ring to open the doors',
  token: 'window',
  tokens: 'windows',
  tokenDo: 'Open',
  tokenUndo: 'Close',
  tokenIntro: 'Open each window to see the plan',
  tokenDone: 'Every window is open. Thank you for being part of this.',
  showerHint: 'Tap the monogram for a shower of petals',
  passTitle: 'Palace pass',
};

/** The two other designs of a ceremony. They share their colours across wedding, engagement and anniversary. */
export const DESIGN_THEMES: Record<Exclude<InvitationDesign, 'regal'>, InvitationTheme> = {
  sage: {
    family: 'regal',
    look: 'sage',
    copy: SAGE_COPY,
    palette: {
      bg: '#f6f4ea',
      paper: '#fffef8',
      primary: '#4d6b57',
      primaryDeep: '#33493b',
      accent: '#b59a55',
      accentSoft: '#e5dcbc',
      pop: '#6f8a5f',
      alert: '#a85a4a',
      ink: '#26302a',
      muted: '#5d675f',
      confetti: ['#8AA37B', '#B59A55', '#E5DCBC', '#C8D5B9', '#FFFFFF'],
    },
  },
  palace: {
    family: 'regal',
    look: 'palace',
    copy: PALACE_COPY,
    palette: {
      bg: '#eef3f7',
      paper: '#fbfdff',
      primary: '#6a3f7a',
      primaryDeep: '#472a55',
      accent: '#b8923f',
      accentSoft: '#efe0b8',
      pop: '#d9768a',
      alert: '#a4515c',
      ink: '#262230',
      muted: '#5b5d6e',
      confetti: ['#F2A3B0', '#E8C776', '#CFE0E9', '#C9A8D6', '#FFFFFF'],
    },
  },
};

/**
 * The look of an invitation. A ceremony can be dressed in any of the three designs; every other
 * occasion has the one look it was made with, whatever design is asked for.
 */
export function themeFor(occasion: Occasion, design: InvitationDesign = DEFAULT_DESIGN): InvitationTheme {
  const base = THEMES[occasion];
  if (base.family !== 'regal' || design === 'regal') return base;
  return DESIGN_THEMES[design];
}

/** The palette as CSS custom properties, set once on the page so every part reads the same colours. */
export function themeVars(palette: Palette): Record<string, string> {
  return {
    '--bg': palette.bg,
    '--paper': palette.paper,
    '--primary': palette.primary,
    '--primary-deep': palette.primaryDeep,
    '--accent': palette.accent,
    '--accent-soft': palette.accentSoft,
    '--pop': palette.pop,
    '--alert': palette.alert,
    '--ink': palette.ink,
    '--muted': palette.muted,
  };
}

/** Which small picture stands for an event, from the words of its title. */
export type EventKind = 'henna' | 'music' | 'turmeric' | 'ceremony' | 'dinner' | 'cake' | 'games' | 'ring' | 'puja' | 'drinks' | 'other';

const EVENT_WORDS: ReadonlyArray<readonly [EventKind, RegExp]> = [
  ['henna', /mehendi|mehndi|henna/i],
  ['music', /sangeet|music|dance|dancing|dj|concert|garba/i],
  ['turmeric', /haldi|pithi|tilak/i],
  ['ring', /ring|engagement|roka|sagai/i],
  ['puja', /puja|pooja|havan|griha|pravesh|satyanarayan|ceremony|phera|jaimala|vidaai|baraat/i],
  ['cake', /cake|candle/i],
  ['games', /game|play|quiz/i],
  ['drinks', /drink|cocktail|toast|brunch|tea/i],
  ['dinner', /dinner|lunch|feast|food|reception|buffet|meal/i],
];

export function eventKind(title: string): EventKind {
  for (const [kind, pattern] of EVENT_WORDS) {
    if (pattern.test(title)) return kind;
  }
  // The wedding itself, whatever it is called, is a ceremony.
  if (/wedding|marriage|vivah|nikah|shaadi|shadi/i.test(title)) return 'ceremony';
  return 'other';
}
