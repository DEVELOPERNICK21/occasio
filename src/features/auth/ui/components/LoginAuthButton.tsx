import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../../../../shared/ui/Text';
import { colors, radius, spacing, typography } from '../../../../shared/theme/tokens';
import { AppleLogoIcon } from './AppleLogoIcon';
import { EmailOutlineIcon } from './EmailOutlineIcon';
import { GoogleGIcon } from './GoogleGIcon';

type Provider = 'apple' | 'google' | 'email';

type Props = {
  provider: Provider;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
};

type Look = {
  background: string;
  border: string | null;
  text: string;
};

// Apple and Google follow their own button guidelines (black, and white with an outline).
// Email is our own, so it is the coral primary.
const LOOKS: Record<Provider, Look> = {
  apple: { background: colors.ink, border: null, text: colors.white },
  google: { background: colors.surface, border: colors.border, text: colors.ink },
  email: { background: colors.accent, border: null, text: colors.white },
};

function ProviderIcon({ provider, color }: { provider: Provider; color: string }) {
  if (provider === 'apple') return <AppleLogoIcon color={color} />;
  if (provider === 'google') return <GoogleGIcon />;
  return <EmailOutlineIcon color={color} />;
}

export function LoginAuthButton({
  provider,
  label,
  onPress,
  disabled = false,
  loading = false,
}: Props) {
  const isDisabled = disabled || loading;
  const look = LOOKS[provider];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: look.background },
        look.border ? { borderWidth: 1, borderColor: look.border } : null,
        pressed && !isDisabled && styles.pressed,
        isDisabled && !loading && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={look.text} />
      ) : (
        <>
          <View style={styles.icon}>
            <ProviderIcon provider={provider} color={look.text} />
          </View>
          <Text style={[styles.label, { color: look.text }]}>{label}</Text>
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
  pressed: {
    opacity: 0.9,
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
});
