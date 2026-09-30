import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../../../../shared/ui/Text';
import { colors, radius, shadow, spacing, typography } from '../../../../shared/theme/tokens';

type Variant = 'google' | 'apple' | 'primary';

type Props = {
  label: string;
  icon: ReactNode;
  variant: Variant;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
};

const VARIANT_STYLE = {
  google: { button: 'google', label: 'labelGoogle', spinner: colors.accent },
  apple: { button: 'apple', label: 'labelPrimary', spinner: colors.white },
  primary: { button: 'primary', label: 'labelPrimary', spinner: colors.white },
} as const;

export function LoginAuthButton({
  label,
  icon,
  variant,
  onPress,
  disabled = false,
  loading = false,
}: Props) {
  const isDisabled = disabled || loading;
  const look = VARIANT_STYLE[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles[look.button],
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={look.spinner} />
      ) : (
        <>
          <View style={styles.icon}>{icon}</View>
          <Text style={[styles.label, styles[look.label]]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  google: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  apple: {
    backgroundColor: colors.ink,
  },
  primary: {
    backgroundColor: colors.accentHover,
  },
  pressed: {
    opacity: 0.92,
  },
  disabled: {
    opacity: 0.55,
  },
  icon: {
    width: 22,
    alignItems: 'center',
  },
  label: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
  },
  labelGoogle: {
    color: colors.ink,
  },
  labelPrimary: {
    color: colors.white,
  },
});
