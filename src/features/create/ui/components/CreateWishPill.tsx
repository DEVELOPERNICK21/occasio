import { Heart } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../../../../shared/ui/Text';
import { colors, radius, shadow, spacing, typography } from '../../../../shared/theme/tokens';

type Props = {
  onPress: () => void;
};

/** Shortcut CTA — starts a birthday draft; occasion grid picks other templates. */
export function CreateWishPill({ onPress }: Props) {
  return (
    <View style={styles.shadowShell}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Quick birthday wish"
        accessibilityHint="Starts a birthday card. Use the grid above for other occasions."
        onPress={onPress}
        style={({ pressed }) => [styles.pill, pressed && styles.pressed]}
      >
        <Heart
          size={18}
          color={colors.white}
          fill={colors.white}
          strokeWidth={2}
          absoluteStrokeWidth
        />
        <Text style={styles.label}>Quick birthday wish</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  shadowShell: {
    borderRadius: radius.full,
    ...shadow.card,
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 3,
  },
  pill: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
  },
  pressed: {
    opacity: 0.92,
    backgroundColor: colors.accentHover,
  },
  label: {
    fontSize: typography.sizeMd,
    lineHeight: typography.sizeMd * 1.2,
    fontWeight: typography.weightSemibold,
    color: colors.white,
  },
});
