import { useRef, useState } from 'react';
import { Pressable, StyleSheet, View, type TextInput as RNTextInput } from 'react-native';
import { Check, Lock, Mail } from 'lucide-react-native';
import { triggerCardHaptic } from '../../../../shared/platform/haptics';
import { Button } from '../../../../shared/ui/Button';
import { Text } from '../../../../shared/ui/Text';
import { TextField } from '../../../../shared/ui/TextField';
import { colors, radius, spacing, typography } from '../../../../shared/theme/tokens';
import {
  emailFieldError,
  passwordFieldError,
  passwordStrength,
  PASSWORD_RULES,
  type PasswordStrength,
} from '../../domain/email';
import type { AuthMode } from '../../application/useAuthFlow';
import { AuthErrorBanner } from './AuthErrorBanner';

type Props = {
  mode: AuthMode;
  email: string;
  onEmailChange: (value: string) => void;
  password: string;
  onPasswordChange: (value: string) => void;
  isLoading: boolean;
  /** Something the server said (wrong password, no such account). */
  formError: string | null;
  /** Called only when both fields are fine. */
  onSubmit: () => void;
  onForgotPassword: () => void;
  onSwitchMode: () => void;
};

const STRENGTH: Record<Exclude<PasswordStrength, 'empty'>, { label: string; bars: number; color: string }> = {
  weak: { label: 'Weak', bars: 1, color: colors.error },
  good: { label: 'Good', bars: 2, color: colors.secondary },
  strong: { label: 'Strong', bars: 3, color: colors.success },
};

function PasswordGuide({ password }: { password: string }) {
  const strength = passwordStrength(password);
  const shown = strength === 'empty' ? null : STRENGTH[strength];

  return (
    <View style={styles.guide}>
      {PASSWORD_RULES.map((rule) => {
        const met = rule.met(password);
        return (
          <View key={rule.id} style={styles.ruleRow} accessibilityLabel={`${rule.label}${met ? ', done' : ''}`}>
            <View style={[styles.tick, met && styles.tickMet]}>
              {met ? <Check size={12} color={colors.white} strokeWidth={3} absoluteStrokeWidth /> : null}
            </View>
            <Text style={[styles.rule, met && styles.ruleMet]}>{rule.label}</Text>
          </View>
        );
      })}
      {shown ? (
        <View style={styles.strengthRow} accessibilityLabel={`Password strength: ${shown.label}`}>
          <View style={styles.bars}>
            {[1, 2, 3].map((bar) => (
              <View
                key={bar}
                style={[styles.bar, bar <= shown.bars && { backgroundColor: shown.color }]}
              />
            ))}
          </View>
          <Text style={[styles.strengthLabel, { color: shown.color }]}>{shown.label}</Text>
        </View>
      ) : null}
    </View>
  );
}

/**
 * Email and password, the way people expect them: the keyboard moves from one
 * field to the next, the password can be shown, mistakes are named under the field
 * they belong to, and creating an account shows what a good password needs.
 */
export function EmailAuthForm({
  mode,
  email,
  onEmailChange,
  password,
  onPasswordChange,
  isLoading,
  formError,
  onSubmit,
  onForgotPassword,
  onSwitchMode,
}: Props) {
  const passwordRef = useRef<RNTextInput>(null);
  const emailRef = useRef<RNTextInput>(null);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const isSignUp = mode === 'sign_up';

  const emailError = emailFieldError(email);
  const passwordError = passwordFieldError(password, mode);
  // A field complains once it has been left, or once Sign in has been pressed.
  const showEmailError = (emailTouched || submitted) && emailError;
  const showPasswordError = (passwordTouched || submitted) && passwordError;

  const submit = () => {
    setSubmitted(true);
    if (emailError) {
      triggerCardHaptic();
      emailRef.current?.focus();
      return;
    }
    if (passwordError) {
      triggerCardHaptic();
      passwordRef.current?.focus();
      return;
    }
    onSubmit();
  };

  return (
    <View style={styles.form}>
      <TextField
        ref={emailRef}
        label="Email"
        value={email}
        onChangeText={onEmailChange}
        onBlur={() => setEmailTouched(true)}
        error={showEmailError ? emailError : null}
        leftIcon={Mail}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType={isSignUp ? 'emailAddress' : 'username'}
        returnKeyType="next"
        blurOnSubmit={false}
        onSubmitEditing={() => passwordRef.current?.focus()}
        editable={!isLoading}
        clearable
      />
      <View style={styles.passwordBlock}>
        <TextField
          ref={passwordRef}
          label="Password"
          value={password}
          onChangeText={onPasswordChange}
          onBlur={() => setPasswordTouched(true)}
          error={showPasswordError ? passwordError : null}
          leftIcon={Lock}
          placeholder={isSignUp ? 'Choose a password' : 'Your password'}
          secret
          autoComplete={isSignUp ? 'new-password' : 'current-password'}
          textContentType={isSignUp ? 'newPassword' : 'password'}
          returnKeyType="go"
          onSubmitEditing={submit}
          editable={!isLoading}
        />
        {!isSignUp ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Forgot password"
            onPress={onForgotPassword}
            disabled={isLoading}
            hitSlop={8}
            style={styles.forgotWrap}
          >
            <Text style={styles.forgot}>Forgot password?</Text>
          </Pressable>
        ) : null}
      </View>

      {isSignUp ? <PasswordGuide password={password} /> : null}

      {formError ? <AuthErrorBanner message={formError} /> : null}

      <Button
        label={isSignUp ? 'Create account' : 'Sign in'}
        onPress={submit}
        loading={isLoading}
        disabled={isLoading}
      />
      <Pressable
        accessibilityRole="button"
        disabled={isLoading}
        onPress={onSwitchMode}
        hitSlop={8}
        style={styles.switchWrap}
      >
        <Text style={styles.switchText}>
          {isSignUp ? 'Already have an account? ' : 'New here? '}
          <Text style={styles.switchLink}>{isSignUp ? 'Sign in' : 'Create an account'}</Text>
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.md,
  },
  passwordBlock: {
    gap: spacing.sm,
  },
  forgotWrap: {
    alignSelf: 'flex-end',
    minHeight: 32,
    justifyContent: 'center',
  },
  forgot: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightSemibold,
    color: colors.accentHover,
  },
  guide: {
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  tick: {
    width: 18,
    height: 18,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tickMet: {
    borderColor: colors.success,
    backgroundColor: colors.success,
  },
  rule: {
    fontSize: typography.sizeSm,
    color: colors.muted,
  },
  ruleMet: {
    color: colors.inkSoft,
  },
  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  bars: {
    flexDirection: 'row',
    gap: 4,
    flex: 1,
    maxWidth: 140,
  },
  bar: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  strengthLabel: {
    fontSize: typography.sizeXs + 1,
    fontWeight: typography.weightSemibold,
  },
  switchWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  switchText: {
    fontSize: typography.sizeSm,
    color: colors.inkSoft,
  },
  switchLink: {
    fontWeight: typography.weightSemibold,
    color: colors.accentHover,
  },
});
