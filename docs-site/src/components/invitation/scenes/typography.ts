/**
 * The size of a name on a stage, in stage units, so a long pair of names still fits the width it
 * has. `room` is the width available in units and `average` how wide a letter is, as a share of
 * its height, in the typeface used.
 */
export function fitNameSize(title: string, room: number, min: number, max: number, average = 0.52): number {
  const letters = Math.max(1, Array.from(title).length);
  return Math.max(min, Math.min(max, Math.floor(room / (letters * average))));
}
