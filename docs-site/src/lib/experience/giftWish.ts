/**
 * The wish that unfurls from the gift as a banner of bold letters, and where each
 * flag hangs. Pure so the layout can be tested without a browser.
 */

/** The wish as one word per rope. At most two ropes, none longer than MAX_ROW letters. */
const WISH_WORDS: Record<string, readonly string[]> = {
  birthday: ['HAPPY', 'BIRTHDAY'],
  anniversary: ['HAPPY', 'ANNIVERSARY'],
  thank_you: ['THANK', 'YOU'],
  // "Congratulations" is fifteen flags wide: too small to read on a phone.
  congratulations: ['CONGRATS'],
  just_because: ['JUST', 'BECAUSE'],
};

const DEFAULT_WORDS = WISH_WORDS.just_because;

/** The longest rope, so every flag can stay big enough to read on a small phone. */
export const MAX_ROW = 11;

/** How far a rope sags in the middle, in flag widths per flag. */
const SAG_PER_FLAG = 0.07;

export function wishRows(templateType: string): readonly string[] {
  return WISH_WORDS[templateType] ?? DEFAULT_WORDS;
}

/** The wish as a sentence, for screen readers: "Happy birthday". */
export function wishText(templateType: string): string {
  const sentence = wishRows(templateType).join(' ').toLowerCase();
  return sentence.charAt(0).toUpperCase() + sentence.slice(1);
}

/**
 * Flag colours per moment. Every one keeps white letters at 3:1 or better, which is
 * what bold text this large needs; a test holds them to it.
 */
const PALETTES: Record<string, readonly string[]> = {
  birthday: ['#E0475B', '#D4551A', '#7B5BE6', '#3B72D9', '#0F9D8A', '#D6438A'],
  anniversary: ['#C9374D', '#B8478F', '#E11D48', '#DB2777', '#9F1239'],
  thank_you: ['#2F8F5B', '#0E8F7E', '#059669', '#CC5A12', '#5B6FD9'],
  congratulations: ['#2563EB', '#9333EA', '#C2410C', '#059669', '#E11D48'],
  just_because: ['#5B6FD9', '#D6438A', '#0E8F7E', '#D4551A'],
};

export function flagColors(templateType: string): readonly string[] {
  return PALETTES[templateType] ?? PALETTES.just_because;
}

export type Flag = {
  char: string;
  row: number;
  /** Position along its own rope, from 0. */
  index: number;
  /** Letters on its rope. */
  count: number;
  /** Order across the whole banner, which sets when it pops out. */
  order: number;
  color: string;
  /** Lean in degrees, so each flag hangs square to a sagging rope. */
  tilt: number;
  /** How far it hangs below the rope's ends, in flag widths. */
  drop: number;
};

const round = (value: number) => Math.round(value * 100) / 100;

export function flagLayout(templateType: string): { maxCount: number; flags: Flag[] } {
  const rows = wishRows(templateType);
  const colors = flagColors(templateType);
  const maxCount = Math.max(...rows.map((word) => word.length));
  const flags: Flag[] = [];
  let order = 0;

  rows.forEach((word, row) => {
    const count = word.length;
    const sag = SAG_PER_FLAG * count;
    Array.from(word).forEach((char, index) => {
      // `across` runs 0 to 1 along the rope, measured at the middle of the flag.
      const across = (index + 0.5) / count;
      const slope = 4 * SAG_PER_FLAG * (1 - 2 * across);
      flags.push({
        char,
        row,
        index,
        count,
        order,
        color: colors[order % colors.length]!,
        tilt: round((Math.atan(slope) * 180) / Math.PI),
        drop: round(sag * (1 - (2 * across - 1) ** 2)),
      });
      order += 1;
    });
  });

  return { maxCount, flags };
}
