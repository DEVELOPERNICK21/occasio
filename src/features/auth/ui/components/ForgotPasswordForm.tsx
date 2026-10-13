import { Pressable, StyleSheet, View } from 'react-native';
import { CircleCheck, Mail } from 'lucide-react-native';
import { Button } from '../../../../shared/ui/Button';
import { Text } from '../../../../shared/ui/Text';
import { TextField } from '../../../../shared/ui/TextField';
import { colors, radius, spacing, typography } from '../../../../shared/theme/tokens';

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
}: Props) {
  return (
    <View style={styles.form}>
      <TextField
        label="Email"
        value={emailInput}
        onChangeText={onEmailChange}
        error={resetSent ? null : error}
        leftIcon={Mail}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="send"
        onSubmitEditing={resetSent ? undefined : onSend}
        editable={!resetSent && !isLoading}
        clearable
      />

      {resetSent ? (
        <View style={styles.success} accessibilityLiveRegion="polite">
          <CircleCheck size={20} color={colors.success} strokeWidth={2.2} absoluteStrokeWidth />
          <Text style={styles.successText}>{successCopy}</Text>
        </View>
      ) : null}
      {resetSent && error ? <Text style={styles.error}>{error}</Text> : null}

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
              <Text style={styles.link}>Use a different email</Text>
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
  success: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.sageSoft,
  },
  successText: {
    flex: 1,
    fontSize: typography.sizeSm,
    lineHeight: typography.sizeSm * 1.45,
    color: colors.success,
  },
  error: {
    fontSize: typography.sizeSm,
    color: colors.error,
  },
  linkWrap: {
    alignSelf: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  link: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightSemibold,
    color: colors.accentHover,
  },
});
