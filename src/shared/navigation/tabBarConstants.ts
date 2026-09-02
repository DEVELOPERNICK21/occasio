import { spacing } from '../theme/tokens';

const BAR_HEIGHT = 72;
const BUBBLE_SIZE = 52;
/** Tiny air gap between bubble and bar top. */
const BUBBLE_BAR_GAP = 4;
/** Space the bubble extends above the bar top — layout reserve only. */
const BUBBLE_RISE = BUBBLE_SIZE + BUBBLE_BAR_GAP;
const BAR_BOTTOM_GAP = spacing.sm;

/** Space to reserve above the floating tab bar (excludes safe-area inset). */
export const FLOATING_TAB_BAR_HEIGHT =
  BAR_HEIGHT + BUBBLE_RISE + BAR_BOTTOM_GAP + spacing.md;

export const TAB_BAR_LAYOUT = {
  barHeight: BAR_HEIGHT,
  bubbleRise: BUBBLE_RISE,
  bubbleBarGap: BUBBLE_BAR_GAP,
  bottomGap: BAR_BOTTOM_GAP,
  bubbleSize: BUBBLE_SIZE,
  /** Visible U-dip under the active bubble. */
  notchDepth: 24,
  notchHalfWidth: 30,
  notchShoulderEase: 16,
  barCornerRadius: 22,
  horizontalMargin: spacing.lg,
  iconSize: 24,
} as const;
