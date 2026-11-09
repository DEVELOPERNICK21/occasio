/**
 * The maths of a scratch card, kept free of the canvas so it can be tested: how much of the foil
 * is left, from the alpha channel of its pixels.
 */

/** Pixels sampled per check: every Nth, so reading a large canvas stays quick. */
export const SAMPLE_STEP = 6;

/** The alpha below which a pixel counts as scratched away. */
const CLEARED_BELOW = 24;

/** How many sampled pixels still hold foil. `data` is RGBA, as `getImageData` returns it. */
export function foilLeft(data: ArrayLike<number>, step = SAMPLE_STEP): number {
  let count = 0;
  for (let i = 3; i < data.length; i += 4 * step) {
    if ((data[i] ?? 0) >= CLEARED_BELOW) count += 1;
  }
  return count;
}

/** The share of the foil that has been scratched away, 0 to 1. */
export function scratchedShare(originalLeft: number, nowLeft: number): number {
  if (originalLeft <= 0) return 1;
  return Math.min(1, Math.max(0, 1 - nowLeft / originalLeft));
}

/** How much of the foil has to go before the date is shown in full. */
export const REVEAL_AT = 0.55;

export function isRevealed(share: number): boolean {
  return share >= REVEAL_AT;
}

/** A heart as a closed path in a box of the given size, for the foil and for its outline. */
export function heartPath(width: number, height: number, digits = 1): string {
  const x = (n: number) => (n * width).toFixed(digits);
  const y = (n: number) => (n * height).toFixed(digits);
  return [
    `M ${x(0.5)} ${y(0.95)}`,
    `C ${x(0.1)} ${y(0.64)} ${x(0.0)} ${y(0.32)} ${x(0.19)} ${y(0.14)}`,
    `C ${x(0.34)} ${y(0.01)} ${x(0.47)} ${y(0.08)} ${x(0.5)} ${y(0.22)}`,
    `C ${x(0.53)} ${y(0.08)} ${x(0.66)} ${y(0.01)} ${x(0.81)} ${y(0.14)}`,
    `C ${x(1.0)} ${y(0.32)} ${x(0.9)} ${y(0.64)} ${x(0.5)} ${y(0.95)}`,
    'Z',
  ].join(' ');
}
