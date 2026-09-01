import { spacing } from '../theme/tokens';

const BAR_HEIGHT = 72;
const BUBBLE_LIFT = 28;
const BAR_BOTTOM_GAP = spacing.sm;

/** Space to reserve above the floating tab bar (excludes safe-area inset). */
export const FLOATING_TAB_BAR_HEIGHT =
  BAR_HEIGHT + BUBBLE_LIFT + BAR_BOTTOM_GAP + spacing.md;

export const TAB_BAR_LAYOUT = {
  barHeight: BAR_HEIGHT,
  bubbleLift: BUBBLE_LIFT,
  bottomGap: BAR_BOTTOM_GAP,
  bubbleSize: 52,
  notchDepth: 26,
  notchHalfWidth: 34,
  horizontalMargin: spacing.lg,
  iconSize: 23,
} as const;
