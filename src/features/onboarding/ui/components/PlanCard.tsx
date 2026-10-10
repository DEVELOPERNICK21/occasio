import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../../../../shared/ui/Text';
import { colors, radius, spacing, typography } from '../../../../shared/theme/tokens';

type Props = {
  title: string;
  priceLine: string;
  /** Store-provided per-month price for yearly plans. */
  perMonthLine?: string | null;
  /** Real saving, e.g. "Save 44%". Only passed when computed from store prices. */
  savingsLine?: string | null;
  highlighted?: boolean;
  disabled?: boolean;
  loading?: boolean;
  onPress: () => void;
};

/** A plan the person can tap to buy. Nothing is pre-selected and tapping opens the store's own confirmation. */
export function PlanCard({
  title,
  priceLine,
  perMonthLine,
  savingsLine,
  highlighted = false,
  disabled = false,
  loading = false,
  onPress,
}: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${priceLine}${perMonthLine ? `. ${perMonthLine}` : ''}${savingsLine ? `. ${savingsLine}` : ''}`}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        highlighted && styles.cardHighlighted,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <View style={styles.copy}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{title}</Text>
          {savingsLine ? (
            <View style={styles.badge}>
              <Text style={styles.badgeLabel}>{savingsLine}</Text>
            </View>
          ) : null}
        </View>
        {perMonthLine ? <Text style={styles.sub}>{perMonthLine}</Text> : null}
      </View>
      {loading ? (
        <ActivityIndicator size="small" color={colors.accent} />
      ) : (
        <Text style={[styles.price, highlighted && styles.priceHighlighted]}>{priceLine}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    minHeight: 64,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  cardHighlighted: { borderColor: colors.accent, borderWidth: 2 },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.55 },
  copy: { flex: 1, gap: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  title: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
  },
  sub: { fontSize: typography.sizeSm, color: colors.inkSoft },
  badge: {
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.accentSoft,
  },
  badgeLabel: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightSemibold,
    color: colors.accentHover,
  },
  price: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
  },
  priceHighlighted: { color: colors.accentHover },
});
