import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { AnalyticsEvents, trackEvent } from '../../../../shared/analytics/events';
import { Button } from '../../../../shared/ui/Button';
import { Field } from '../../../../shared/ui/Field';
import { Text } from '../../../../shared/ui/Text';
import { TextInput } from '../../../../shared/ui/TextInput';
import { colors, radius, spacing, typography } from '../../../../shared/theme/tokens';
import { isAuthError, useAuthContext } from '../../application/AuthProvider';
import {
  isValidEmail,
  isValidPassword,
  MIN_PASSWORD_LENGTH,
  normalizeEmail,
} from '../../domain/email';
import { gatedActionLabel } from '../../domain/gatedActions';

type Step = 'choose' | 'email';

export function SoftAuthModal() {
  const {
    softAuthRequest,
    dismissSoftAuth,
    completeSoftAuth,
    signInGoogle,
    signInEmail,
    createEmailAccount,
  } = useAuthContext();

  const visible = softAuthRequest !== null;
  const action = softAuthRequest?.action ?? 'vault_save';

  const [step, setStep] = useState<Step>('choose');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!visible) {
      setStep('choose');
      setEmailInput('');
      setPasswordInput('');
      setIsSignUp(false);
      setError(null);
      setIsLoading(false);
    }
  }, [visible]);

  const handleClose = () => {
    dismissSoftAuth();
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signInGoogle();
      completeSoftAuth();
    } catch (e) {
      if (isAuthError(e) && e.code === 'CANCELLED') {
        return;
      }
      setError(isAuthError(e) ? e.message : 'Google sign-in failed. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSubmit = async () => {
    const email = normalizeEmail(emailInput);
    if (!isValidEmail(email)) {
      setError('Enter a valid email address.');
      return;
    }
    if (!isValidPassword(passwordInput)) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }

    setIsLoading(true);
    setError(null);
    trackEvent(AnalyticsEvents.emailSignInStarted, { mode: isSignUp ? 'sign_up' : 'sign_in' });

    try {
      if (isSignUp) {
        await createEmailAccount(email, passwordInput);
      } else {
        await signInEmail(email, passwordInput);
      }
      completeSoftAuth();
    } catch (e) {
      setError(isAuthError(e) ? e.message : 'Sign-in failed. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.eyebrow}>Sign in</Text>
          <Text style={styles.title}>Continue to {gatedActionLabel(action)}</Text>
          <Text style={styles.body}>
            Create and share stay free. Sign in with Google or email — no SMS charges.
          </Text>

          {step === 'choose' ? (
            <View style={styles.form}>
              <Button
                label={isLoading ? 'Signing in…' : 'Continue with Google'}
                onPress={handleGoogleSignIn}
                disabled={isLoading}
              />
              <Button
                label="Continue with email"
                variant="secondary"
                onPress={() => {
                  setStep('email');
                  setError(null);
                }}
                disabled={isLoading}
              />
            </View>
          ) : (
            <View style={styles.form}>
              <Field label="Email">
                <TextInput
                  value={emailInput}
                  onChangeText={setEmailInput}
                  placeholder="you@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  style={styles.input}
                />
              </Field>
              <Field
                label="Password"
                hint={`At least ${MIN_PASSWORD_LENGTH} characters`}
              >
                <TextInput
                  value={passwordInput}
                  onChangeText={setPasswordInput}
                  placeholder="Your password"
                  secureTextEntry
                  autoComplete={isSignUp ? 'new-password' : 'password'}
                  style={styles.input}
                />
              </Field>
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <Button
                label={
                  isLoading
                    ? 'Please wait…'
                    : isSignUp
                      ? 'Create account'
                      : 'Sign in'
                }
                onPress={handleEmailSubmit}
                disabled={isLoading}
              />
              <Button
                label={isSignUp ? 'Already have an account? Sign in' : 'New here? Create account'}
                variant="ghost"
                onPress={() => {
                  setIsSignUp((value) => !value);
                  setError(null);
                }}
                disabled={isLoading}
              />
              <Button
                label="Back"
                variant="ghost"
                onPress={() => {
                  setStep('choose');
                  setError(null);
                }}
                disabled={isLoading}
              />
            </View>
          )}

          <Button label="Not now" variant="ghost" onPress={handleClose} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(28, 25, 20, 0.45)',
    justifyContent: 'flex-end',
    padding: spacing.lg,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  eyebrow: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightSemibold,
    color: colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  title: {
    fontSize: typography.sizeXl,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
  },
  body: {
    fontSize: typography.sizeSm,
    lineHeight: typography.sizeSm * 1.5,
    color: colors.inkSoft,
  },
  form: {
    marginTop: spacing.sm,
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
    backgroundColor: colors.bg,
  },
  error: {
    fontSize: typography.sizeSm,
    color: colors.error,
  },
});
