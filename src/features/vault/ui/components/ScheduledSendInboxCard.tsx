import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../../../../shared/ui/Text';
import { colors, radius, spacing, typography } from '../../../../shared/theme/tokens';
import type { ScheduledSendStatus } from '../../domain/types';

type Props = {
  personName: string;
  occasionLabel: string;
  deadlineLabel: string;
  status: ScheduledSendStatus;
  onPress: () => void;
};

export function ScheduledSendInboxCard({
  personName,
  occasionLabel,
  deadlineLabel,
  status,
  onPress,
}: Props) {
  const eyebrow = status === 'review' ? 'Waiting for review' : 'Approved';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Review ${occasionLabel.toLowerCase()} card for ${personName}`}
      onPress={onPress}
      style={styles.card}
    >
      <View style={styles.copy}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.name} numberOfLines={1}>
          {personName}
        </Text>
        <Text style={styles.meta}>
          {occasionLabel} · {deadlineLabel}
        </Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  eyebrow: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightSemibold,
    color: colors.muted,
    letterSpacing: 0.4,
  },
  name: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
  },
  meta: {
    fontSize: typography.sizeSm,
    color: colors.inkSoft,
  },
  chevron: {
    fontSize: typography.sizeLg,
    color: colors.muted,
    paddingHorizontal: spacing.xs,
  },
});
