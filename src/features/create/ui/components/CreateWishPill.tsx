import { Heart } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../../../../shared/ui/Text';
import { colors, radius, spacing, typography } from '../../../../shared/theme/tokens';

type Props = {
  onPress: () => void;
};

/**
 * Secondary fast path — not the primary CTA (audience grid is).
 * Soft outline so the home fold stays one-job: pick a person.
 */
export function CreateWishPill({ onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Quick birthday wish"
      accessibilityHint="Starts a birthday card with one photo. Skip choosing who and a frame."
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.iconWrap}>
        <Heart
          size={16}
          color={colors.accent}
          fill={colors.accentSoft}
          strokeWidth={2}
          absoluteStrokeWidth
        />
      </View>
      <View style={styles.copy}>
        <Text style={styles.label}>Need something faster?</Text>
        <Text style={styles.action}>Quick birthday wish</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pressed: {
    opacity: 0.88,
    backgroundColor: colors.sidebar,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.sidebar,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontSize: typography.sizeXs,
    color: colors.muted,
  },
  action: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightSemibold,
    color: colors.accent,
  },
});
