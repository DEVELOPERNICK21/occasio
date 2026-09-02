import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { colors, spacing, typography } from '../theme/tokens';
import { Text } from './Text';

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
};

/** Compact primary action in the screen header — use instead of a full-width footer CTA. */
export function ScreenHeaderAction({ label, onPress, disabled, loading = false }: Props) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.root,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
      ]}
    >
      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={colors.accent} />
          <Text style={[styles.label, styles.labelDisabled]}>{label}</Text>
        </View>
      ) : (
        <Text style={[styles.label, isDisabled && styles.labelDisabled]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    minHeight: 48,
    justifyContent: 'center',
    paddingLeft: spacing.md,
    paddingVertical: spacing.xs,
  },
  pressed: {
    opacity: 0.75,
  },
  disabled: {
    opacity: 0.45,
  },
  label: {
    fontSize: typography.sizeMd,
    lineHeight: typography.sizeMd * 1.2,
    fontWeight: typography.weightSemibold,
    color: colors.accent,
  },
  labelDisabled: {
    color: colors.muted,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
