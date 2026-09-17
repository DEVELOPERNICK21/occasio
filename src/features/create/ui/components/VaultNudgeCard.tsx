import { Heart } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../../../../shared/ui/Text';
import { CardWashBackground } from '../../../../shared/ui/CardWashBackground';
import { colors, radius, shadow, spacing, typography } from '../../../../shared/theme/tokens';

type Props = {
  title: string;
  body: string;
  actionLabel: string;
  onPress: () => void;
};

/** Warm Vault invite — helpful, not urgent. */
export function VaultNudgeCard({ title, body, actionLabel, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${body}`}
      accessibilityHint={actionLabel}
      onPress={onPress}
      style={({ pressed }) => [styles.shadowShell, pressed && styles.pressed]}
    >
      <View style={styles.card}>
        <CardWashBackground
          variant="upcoming"
          primary={colors.accentSoft}
          secondary={colors.secondary}
        />
        <View style={styles.row}>
          <View style={styles.iconWrap}>
            <Heart
              size={18}
              color={colors.accent}
              fill={colors.accentSoft}
              strokeWidth={2}
              absoluteStrokeWidth
            />
          </View>
          <View style={styles.copy}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.body}>{body}</Text>
            <Text style={styles.action}>{actionLabel}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  shadowShell: {
    borderRadius: radius.lg,
    ...shadow.card,
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 2,
  },
  pressed: {
    opacity: 0.94,
    transform: [{ scale: 0.995 }],
  },
  card: {
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: {
    zIndex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.sidebar,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  title: {
    fontSize: typography.sizeMd,
    lineHeight: typography.sizeMd * 1.3,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
    letterSpacing: -0.2,
  },
  body: {
    fontSize: typography.sizeSm,
    lineHeight: typography.sizeSm * 1.45,
    color: colors.inkSoft,
  },
  action: {
    marginTop: spacing.xs,
    fontSize: typography.sizeSm,
    fontWeight: typography.weightSemibold,
    color: colors.accent,
  },
});
