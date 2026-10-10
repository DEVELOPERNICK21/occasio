import { StyleSheet, View } from 'react-native';
import { Text } from '../../../../shared/ui/Text';
import { colors, radius, spacing, typography } from '../../../../shared/theme/tokens';
import type { HistorySummary } from '../../domain/historyList';

type Props = {
  summary: HistorySummary;
};

export function HistorySummaryCard({ summary }: Props) {
  const stats = [
    { label: 'This month', value: summary.thisMonth },
    { label: 'Active links', value: summary.active },
    { label: 'All time', value: summary.total },
  ];

  return (
    <View
      accessible
      accessibilityLabel={`${summary.thisMonth} shared this month, ${summary.active} active links, ${summary.total} in total`}
      style={styles.card}
    >
      {stats.map((stat, index) => (
        <View key={stat.label} style={[styles.stat, index > 0 && styles.statDivider]}>
          <Text style={styles.value}>{stat.value}</Text>
          <Text style={styles.label}>{stat.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    paddingVertical: spacing.md,
    borderRadius: radius.xl,
    backgroundColor: colors.sidebar,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  statDivider: {
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
  },
  value: {
    fontSize: typography.sizeLg,
    lineHeight: typography.sizeLg * 1.2,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
  },
  label: {
    fontSize: typography.sizeXs,
    color: colors.inkSoft,
  },
});
