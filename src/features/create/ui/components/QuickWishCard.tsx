import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../../../../shared/ui/Text';
import { colors, radius, shadow, spacing, typography } from '../../../../shared/theme/tokens';

type Props = {
  onPress: () => void;
};

/** Low-friction entry — spontaneous wish without picking a template first. */
export function QuickWishCard({ onPress }: Props) {
  return (
    <View style={styles.shadowShell}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Quick wish. Start a birthday card in minutes."
        onPress={onPress}
        style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      >
        <View style={styles.copy}>
          <Text style={styles.eyebrow}>Quick wish</Text>
          <Text style={styles.headline}>Send a card in minutes</Text>
          <Text style={styles.action}>Start →</Text>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  shadowShell: {
    marginTop: spacing.sm,
    borderRadius: radius.lg,
    ...shadow.card,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.sidebar,
    overflow: 'hidden',
    minHeight: 72,
  },
  pressed: {
    opacity: 0.96,
  },
  copy: {
    padding: spacing.sm,
    gap: 2,
  },
  eyebrow: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightSemibold,
    color: colors.accent,
  },
  headline: {
    fontSize: typography.sizeMd,
    lineHeight: typography.sizeMd * 1.2,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
    letterSpacing: -0.2,
  },
  action: {
    marginTop: spacing.xs,
    fontSize: typography.sizeSm,
    fontWeight: typography.weightSemibold,
    color: colors.accent,
  },
});
