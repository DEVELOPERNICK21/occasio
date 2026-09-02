import { Pressable, StyleSheet, View } from 'react-native';
import { Button } from '../../../../shared/ui/Button';
import { Field } from '../../../../shared/ui/Field';
import { Text } from '../../../../shared/ui/Text';
import { TextInput } from '../../../../shared/ui/TextInput';
import { colors, radius, spacing, typography } from '../../../../shared/theme/tokens';

type Tone = 'default' | 'onDark';

type Props = {
  emailInput: string;
  onEmailChange: (value: string) => void;
  resetSent: boolean;
  successCopy: string;
  error: string | null;
  isLoading: boolean;
  canResend: boolean;
  resendLabel: string;
  onSend: () => void;
  onResend: () => void;
  onBackToSignIn: () => void;
  onUseDifferentEmail?: () => void;
  tone?: Tone;
};

export function ForgotPasswordForm({
  emailInput,
  onEmailChange,
  resetSent,
  successCopy,
  error,
  isLoading,
  canResend,
  resendLabel,
  onSend,
  onResend,
  onBackToSignIn,
  onUseDifferentEmail,
  tone = 'default',
}: Props) {
  const onDark = tone === 'onDark';

  return (
    <View style={styles.form}>
      <Field label="Email" tone={tone}>
        <TextInput
          value={emailInput}
          onChangeText={onEmailChange}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          style={styles.input}
          editable={!resetSent}
        />
      </Field>

      {resetSent ? <Text style={[styles.success, onDark && styles.successOnDark]}>{successCopy}</Text> : null}
      {error ? <Text style={[styles.error, onDark && styles.errorOnDark]}>{error}</Text> : null}

      {resetSent ? (
        <>
          <Button
            label={resendLabel}
            variant="secondary"
            onPress={onResend}
            loading={isLoading}
            disabled={!canResend || isLoading}
          />
          {onUseDifferentEmail ? (
            <Pressable
              accessibilityRole="button"
              onPress={onUseDifferentEmail}
              hitSlop={8}
              style={styles.linkWrap}
            >
              <Text style={[styles.link, onDark && styles.linkOnDark]}>Use a different email</Text>
            </Pressable>
          ) : null}
          <Button label="Back to sign in" onPress={onBackToSignIn} />
        </>
      ) : (
        <Button
          label="Send reset link"
          onPress={onSend}
          loading={isLoading}
          disabled={isLoading}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.md,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.sizeMd,
    color: colors.ink,
    backgroundColor: colors.surface,
  },
  success: {
    fontSize: typography.sizeSm,
    lineHeight: typography.sizeSm * 1.45,
    color: colors.success,
  },
  successOnDark: {
    color: '#B8F5D4',
  },
  error: {
    fontSize: typography.sizeSm,
    color: colors.error,
  },
  errorOnDark: {
    color: '#FCA5A5',
  },
  linkWrap: {
    alignSelf: 'center',
  },
  link: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightSemibold,
    color: colors.accent,
  },
  linkOnDark: {
    color: colors.accentSoft,
  },
});
