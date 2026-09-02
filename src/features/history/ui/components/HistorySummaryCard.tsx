import { StyleSheet, View } from 'react-native';
import { Text } from '../../../../shared/ui/Text';
import { colors, radius, spacing, typography } from '../../../../shared/theme/tokens';
import type { HistorySummary } from '../../domain/historyList';

type Props = {
  summary: HistorySummary;
};

export function HistorySummaryCard({ summary }: Props) {
  const headline =
    summary.thisMonth > 0
      ? `You've shared ${summary.thisMonth} wish${summary.thisMonth === 1 ? '' : 'es'} this month`
      : 'Your shared wishes live here';

  return (
    <View style={styles.card}>
      <View pointerEvents="none" style={styles.orb} />
      <Text style={styles.eyebrow}>YOUR LEGACY</Text>
      <Text style={styles.headline}>{headline}</Text>
      <Text style={styles.body}>
        {summary.active} active link{summary.active === 1 ? '' : 's'} · {summary.total} total
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.sidebar,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    gap: spacing.xs,
  },
  orb: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: radius.full,
    backgroundColor: colors.tertiary,
    opacity: 0.35,
    top: -24,
    right: -16,
  },
  eyebrow: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightSemibold,
    color: colors.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  headline: {
    fontSize: typography.sizeMd,
    lineHeight: typography.sizeMd * 1.35,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
    letterSpacing: -0.2,
  },
  body: {
    fontSize: typography.sizeSm,
    lineHeight: typography.sizeSm * 1.45,
    color: colors.inkSoft,
  },
});
