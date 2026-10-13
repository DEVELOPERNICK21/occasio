import { spacing } from '../theme/tokens';

const BAR_HEIGHT = 64;
const BAR_BOTTOM_GAP = spacing.sm;

/** Space to reserve above the floating tab bar (excludes safe-area inset). */
export const FLOATING_TAB_BAR_HEIGHT = BAR_HEIGHT + BAR_BOTTOM_GAP + spacing.md;

export const TAB_BAR_LAYOUT = {
  barHeight: BAR_HEIGHT,
  bottomGap: BAR_BOTTOM_GAP,
  horizontalMargin: spacing.lg,
  /** Room between the bar's edge and the tabs inside it. */
  trackPadding: spacing.sm,
  /** The coral pill behind the current tab. */
  pillHeight: 46,
  iconSize: 22,
  /** Icon and name inside the pill: padding before the icon, gap between icon and name. */
  pillPadding: 16,
  iconNameGap: 8,
} as const;
