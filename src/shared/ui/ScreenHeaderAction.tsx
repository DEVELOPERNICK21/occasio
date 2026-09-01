import { Pressable, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../theme/tokens';
import { Text } from './Text';

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
};

/** Compact primary action in the screen header — use instead of a full-width footer CTA. */
export function ScreenHeaderAction({ label, onPress, disabled }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.root,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <Text style={[styles.label, disabled && styles.labelDisabled]}>{label}</Text>
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
});
