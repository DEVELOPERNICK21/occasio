import { Pressable, StyleSheet, View } from 'react-native';
import { ChevronRight } from '../../../../shared/ui/icons/lucide';
import { Text } from '../../../../shared/ui/Text';
import { colors, radius, spacing, typography } from '../../../../shared/theme/tokens';
import {
  balanceDetail,
  balanceHeadline,
  type WishBalance,
} from '../../../billing/domain/wishBalance';

type Props = {
  balance: WishBalance;
  /** Opens the profile, where the plan and every purchase are listed. */
  onPress: () => void;
  /** Shown only when there is nothing left to send: a way to get more. */
  onGetMore?: () => void;
};

/**
 * How many wishes are ready to send, and where they come from. The number is the server's own count, so it
 * is the one that will be enforced. Quiet when there are wishes; plain and helpful when there are none.
 */
export function WishBalanceCard({ balance, onPress, onGetMore }: Props) {
  const empty = balance.ready === 0;
  const headline = balanceHeadline(balance);
  const detail = balanceDetail(balance);

  return (
    <View style={[styles.card, empty && styles.cardEmpty]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${headline}. ${detail}. Open your plan`}
        onPress={onPress}
        style={styles.row}
      >
        <View style={[styles.count, empty && styles.countEmpty]}>
          <Text style={[styles.countText, empty && styles.countTextEmpty]}>{balance.ready}</Text>
        </View>
        <View style={styles.copy}>
          <Text style={styles.headline}>{headline}</Text>
          <Text style={styles.detail}>{detail}</Text>
        </View>
        <ChevronRight size={18} color={colors.muted} strokeWidth={2} absoluteStrokeWidth />
      </Pressable>
      {empty && onGetMore ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="See plans"
          onPress={onGetMore}
          hitSlop={8}
          style={styles.more}
        >
          <Text style={styles.moreText}>See plans</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  cardEmpty: {
    backgroundColor: colors.amberSoft,
    borderColor: colors.secondary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
    minHeight: 44,
  },
  count: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countEmpty: {
    backgroundColor: colors.surface,
  },
  countText: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
    color: colors.accentHover,
  },
  countTextEmpty: {
    color: colors.ink,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  headline: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
  },
  detail: {
    fontSize: typography.sizeXs,
    lineHeight: typography.sizeXs * 1.4,
    color: colors.inkSoft,
  },
  more: {
    alignSelf: 'flex-start',
    minHeight: 36,
    justifyContent: 'center',
    marginLeft: 36 + spacing.sm + 2,
  },
  moreText: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
    textDecorationLine: 'underline',
  },
});
