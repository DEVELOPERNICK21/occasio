import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../../../../shared/ui/Text';
import { colors, radius, shadow, spacing, typography } from '../../../../shared/theme/tokens';
import { AppleLogoIcon } from './AppleLogoIcon';
import { EmailOutlineIcon } from './EmailOutlineIcon';
import { GoogleGIcon } from './GoogleGIcon';

type Provider = 'apple' | 'google' | 'email';
/** `dark` = over the login photo; `light` = on a white sheet. */
type Surface = 'light' | 'dark';

type Props = {
  provider: Provider;
  label: string;
  onPress: () => void;
  surface?: Surface;
  disabled?: boolean;
  loading?: boolean;
};

type Look = {
  background: string;
  border: string | null;
  text: string;
};

const LOOKS: Record<Surface, Record<Provider, Look>> = {
  light: {
    apple: { background: colors.ink, border: null, text: colors.white },
    google: { background: colors.surface, border: colors.border, text: colors.ink },
    email: { background: colors.surface, border: colors.border, text: colors.ink },
  },
  dark: {
    // Apple allows the white style on dark backgrounds; the black one vanishes into the photo.
    apple: { background: colors.white, border: null, text: colors.ink },
    google: { background: colors.white, border: null, text: colors.ink },
    email: { background: colors.accentHover, border: null, text: colors.white },
  },
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
  surface = 'light',
  disabled = false,
  loading = false,
}: Props) {
  const isDisabled = disabled || loading;
  const look = LOOKS[surface][provider];

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
        surface === 'dark' && styles.lifted,
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
  lifted: {
    ...shadow.card,
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
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
