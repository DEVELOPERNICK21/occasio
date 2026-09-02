import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../../../../shared/ui/Text';
import { colors, radius, spacing, typography } from '../../../../shared/theme/tokens';

type Props = {
  title: string;
  body: string;
  actionLabel: string;
  onPress: () => void;
};

/** High-salience Vault nudge — dark card on cream canvas; text-only (no icon — tab bar owns the wand). */
export function VaultNudgeCard({ title, body, actionLabel, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${body}`}
      accessibilityHint={actionLabel}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{body}</Text>
      </View>
      <Text style={styles.action}>{actionLabel} →</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.ink,
    gap: spacing.sm,
  },
  pressed: {
    opacity: 0.94,
    transform: [{ scale: 0.995 }],
  },
  copy: {
    gap: spacing.xs,
  },
  title: {
    fontSize: typography.sizeMd,
    lineHeight: typography.sizeMd * 1.3,
    fontWeight: typography.weightSemibold,
    color: colors.white,
    letterSpacing: -0.2,
  },
  body: {
    fontSize: typography.sizeSm,
    lineHeight: typography.sizeSm * 1.5,
    color: colors.tertiary,
  },
  action: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightSemibold,
    color: colors.secondary,
    marginTop: spacing.xs,
  },
});
