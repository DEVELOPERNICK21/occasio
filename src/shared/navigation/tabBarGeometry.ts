/**
 * Where each tab sits while the coral pill moves between them.
 *
 * `pos` is the pill's position as a number between tab indexes: 0 is on the first
 * tab, 1.5 is halfway between the second and third. The tab the pill is on takes the
 * wide width, the others share what is left, and they trade width as it travels, so
 * the bar always fills exactly `inner` pixels. Pure and worklet-safe, so the same
 * numbers drive the animation on the UI thread and the unit tests.
 */

/** The widest a tab gets (icon and name), and the narrowest, in px. */
export const ACTIVE_TAB_WIDTH = 124;
export const MIN_TAB_WIDTH = 48;

export type TabSlot = {
  left: number;
  width: number;
  /** 1 while the pill is on this tab, 0 once it is a whole tab away. Drives the fade of the name. */
  activeness: number;
};

function clamp(value: number, low: number, high: number): number {
  'worklet';
  return Math.min(Math.max(value, low), high);
}

/** The wide width this bar can afford: never so wide that the others drop below the minimum. */
export function activeWidthFor(inner: number, count: number): number {
  'worklet';
  return Math.min(ACTIVE_TAB_WIDTH, inner - (count - 1) * MIN_TAB_WIDTH);
}

/** The narrow width every other tab gets when the pill rests. */
export function restingWidthFor(inner: number, count: number): number {
  'worklet';
  return (inner - activeWidthFor(inner, count)) / (count - 1);
}

export function tabSlot(pos: number, index: number, inner: number, count: number): TabSlot {
  'worklet';
  const wide = activeWidthFor(inner, count);
  const narrow = restingWidthFor(inner, count);
  const activeness = clamp(1 - Math.abs(pos - index), 0, 1);
  // Everything before the pill is narrow; the pill's own width is added once it has been passed.
  const passed = index === 0 ? 0 : 1 - clamp(pos - (index - 1), 0, 1);
  return {
    left: index * narrow + passed * (wide - narrow),
    width: narrow + activeness * (wide - narrow),
    activeness,
  };
}

/** The pill itself: always the wide width, travelling one narrow tab per step. */
export function pillSlot(pos: number, inner: number, count: number): { left: number; width: number } {
  'worklet';
  return {
    left: clamp(pos, 0, count - 1) * restingWidthFor(inner, count),
    width: activeWidthFor(inner, count),
  };
}
