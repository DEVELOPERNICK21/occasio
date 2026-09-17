/** Staged card reveal beats (ms) — photo → occasion → name → message → celebration. */
export const CARD_REVEAL = {
  photoAt: 0,
  photoMs: 700,
  occasionAt: 650,
  occasionMs: 550,
  nameAt: 1200,
  nameMs: 600,
  messageAt: 1850,
  messageMs: 650,
  /** When celebration / Lottie should start. */
  celebrationAt: 2600,
  /** Total sequence before celebration feels “ready”. */
  totalMs: 2600,
} as const;
