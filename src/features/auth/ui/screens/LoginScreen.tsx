import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnalyticsEvents, trackEvent } from '../../../../shared/analytics/events';
import { triggerCardHaptic } from '../../../../shared/platform/haptics';
import { Button } from '../../../../shared/ui/Button';
import { Field } from '../../../../shared/ui/Field';
import { Text } from '../../../../shared/ui/Text';
import { TextInput } from '../../../../shared/ui/TextInput';
import { colors, radius, spacing, typography } from '../../../../shared/theme/tokens';
import { isAuthError, useAuthContext } from '../../application/AuthProvider';
import { usePasswordReset } from '../../application/usePasswordReset';
import {
  isValidEmail,
  isValidPassword,
  MIN_PASSWORD_LENGTH,
  normalizeEmail,
} from '../../domain/email';
import { AuthLegalFooter } from '../components/AuthLegalFooter';
import { GoogleGIcon } from '../components/GoogleGIcon';
import { LoginAuthButton } from '../components/LoginAuthButton';
import { LoginBrandMark } from '../components/LoginBrandMark';
import { LoginHeroBackground } from '../components/LoginHeroBackground';
import { EmailOutlineIcon } from '../components/EmailOutlineIcon';
import { ForgotPasswordForm } from '../components/ForgotPasswordForm';

type Step = 'welcome' | 'email' | 'forgot';

type Props = {
  /** Return to guest browsing — shown as top-left back on welcome step. */
  onDismiss?: () => void;
};

function LoginBackButton({
  label,
  onPress,
  topInset,
}: {
  label: string;
  onPress: () => void;
  topInset: number;
}) {
  return (
    <View style={[styles.backBar, topInset > 0 && { paddingTop: topInset + spacing.sm }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        hitSlop={8}
        style={styles.backButton}
      >
        <Text style={styles.back}>← {label}</Text>
      </Pressable>
    </View>
  );
}

export function LoginScreen({ onDismiss }: Props) {
  const insets = useSafeAreaInsets();
  const { signInGoogle, signInEmail, createEmailAccount } = useAuthContext();
  const passwordReset = usePasswordReset();

  const [step, setStep] = useState<Step>('welcome');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    triggerCardHaptic();
    trackEvent(AnalyticsEvents.googleSignInStarted);
    try {
      await signInGoogle();
    } catch (e) {
      if (isAuthError(e) && e.code === 'CANCELLED') {
        return;
      }
      const message = isAuthError(e) ? e.message : 'Google sign-in failed. Try again.';
      setError(message);
      trackEvent(AnalyticsEvents.googleSignInFailed, {
        code: isAuthError(e) ? e.code : 'unknown',
      });
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
    triggerCardHaptic();
    trackEvent(AnalyticsEvents.emailSignInStarted, { mode: isSignUp ? 'sign_up' : 'sign_in' });

    try {
      if (isSignUp) {
        await createEmailAccount(email, passwordInput);
      } else {
        await signInEmail(email, passwordInput);
      }
    } catch (e) {
      setError(isAuthError(e) ? e.message : 'Sign-in failed. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'forgot') {
    return (
      <View style={styles.root}>
        <LoginHeroBackground />
        <View style={[styles.backOverlay, { paddingTop: insets.top + spacing.sm }]}>
          <LoginBackButton
            label="Back"
            topInset={0}
            onPress={() => {
              setStep('email');
              setIsSignUp(false);
              passwordReset.clearResetState();
            }}
          />
        </View>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={[
              styles.emailContent,
              {
                paddingTop: insets.top + spacing['2xl'] + spacing.md,
                paddingBottom: insets.bottom + spacing.xl,
              },
            ]}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.emailTitle}>Reset password</Text>
            <Text style={styles.emailBody}>
              Enter the email for your account. We will send a link to choose a new password.
            </Text>

            <View style={styles.formPanel}>
              <ForgotPasswordForm
                tone="onDark"
                emailInput={emailInput}
                onEmailChange={setEmailInput}
                resetSent={passwordReset.resetSent}
                successCopy={passwordReset.successCopy}
                error={passwordReset.error}
                isLoading={passwordReset.isLoading}
                canResend={passwordReset.canResend}
                resendLabel={passwordReset.resendLabel}
                onSend={() => void passwordReset.sendReset(emailInput)}
                onResend={() => void passwordReset.sendReset(emailInput)}
                onBackToSignIn={() => {
                  setStep('email');
                  setIsSignUp(false);
                  passwordReset.clearResetState();
                }}
                onUseDifferentEmail={passwordReset.clearResetState}
              />
            </View>

            <AuthLegalFooter onDark />
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    );
  }

  if (step === 'email') {
    return (
      <View style={styles.root}>
        <LoginHeroBackground />
        <View style={[styles.backOverlay, { paddingTop: insets.top + spacing.sm }]}>
          <LoginBackButton
            label="Back"
            topInset={0}
            onPress={() => {
              setStep('welcome');
              setError(null);
              passwordReset.clearResetState();
            }}
          />
        </View>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={[
              styles.emailContent,
              {
                paddingTop: insets.top + spacing['2xl'] + spacing.md,
                paddingBottom: insets.bottom + spacing.xl,
              },
            ]}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.emailTitle}>Continue with email</Text>
            <Text style={styles.emailBody}>
              Sign in with your email and password, or create a new account.
            </Text>

            <View style={styles.formPanel}>
              <View style={styles.form}>
              <Field label="Email" tone="onDark">
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
                tone="onDark"
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
              {!isSignUp ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Forgot password"
                  onPress={() => {
                    setStep('forgot');
                    setError(null);
                    passwordReset.clearResetState();
                  }}
                  hitSlop={8}
                  style={styles.forgotLinkWrap}
                >
                  <Text style={styles.forgotLink}>Forgot password?</Text>
                </Pressable>
              ) : null}
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <Button
                label={isSignUp ? 'Create account' : 'Sign in'}
                onPress={handleEmailSubmit}
                loading={isLoading}
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
              </View>
            </View>

            <AuthLegalFooter onDark />
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <LoginHeroBackground />

      <View
        style={[
          styles.content,
          {
            paddingTop: insets.top + spacing.md,
            paddingBottom: insets.bottom + spacing.lg,
          },
        ]}
      >
        {onDismiss ? (
          <LoginBackButton
            label="Back"
            topInset={0}
            onPress={onDismiss}
          />
        ) : null}

        <View style={styles.main}>
          <View style={styles.brandBlock}>
            <LoginBrandMark />
            <Text style={styles.brandName}>Occasio</Text>
            <Text style={styles.tagline}>
              Celebrate every moment.{'\n'}Connect with the people who matter most.
            </Text>
          </View>

          <View style={styles.actions}>
            {error ? <Text style={styles.errorCentered}>{error}</Text> : null}
            <LoginAuthButton
              label="Continue with Google"
              icon={<GoogleGIcon />}
              variant="google"
              onPress={handleGoogleSignIn}
              loading={isLoading}
              disabled={isLoading}
            />
            <LoginAuthButton
              label="Continue with email"
              icon={<EmailOutlineIcon />}
              variant="primary"
              onPress={() => {
                setStep('email');
                setError(null);
              }}
              disabled={isLoading}
            />
          </View>
        </View>

        <View style={styles.footer}>
          <AuthLegalFooter onDark />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  main: {
    flex: 1,
    justifyContent: 'flex-end',
    gap: spacing.xl,
    paddingBottom: spacing.sm,
  },
  brandBlock: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  brandName: {
    fontSize: typography.size2xl,
    lineHeight: typography.size2xl * 1.08,
    fontWeight: typography.weightSemibold,
    color: colors.white,
    letterSpacing: -0.5,
  },
  tagline: {
    marginTop: spacing.xs,
    fontSize: typography.sizeMd,
    lineHeight: typography.sizeMd * 1.5,
    color: 'rgba(255, 255, 255, 0.88)',
    textAlign: 'center',
    maxWidth: 300,
  },
  actions: {
    gap: spacing.md,
    width: '100%',
    maxWidth: 360,
    alignSelf: 'center',
  },
  footer: {
    paddingTop: spacing.md,
  },
  errorCentered: {
    fontSize: typography.sizeSm,
    color: '#FCA5A5',
    textAlign: 'center',
  },
  emailContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  backBar: {
    alignSelf: 'flex-start',
    zIndex: 2,
  },
  backOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2,
    paddingHorizontal: spacing.lg,
  },
  backButton: {
    alignSelf: 'flex-start',
    minHeight: 44,
    justifyContent: 'center',
  },
  back: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
    color: colors.white,
  },
  emailTitle: {
    fontSize: typography.sizeXl,
    fontWeight: typography.weightSemibold,
    color: colors.white,
    letterSpacing: -0.3,
  },
  emailBody: {
    fontSize: typography.sizeSm,
    lineHeight: typography.sizeSm * 1.45,
    color: 'rgba(255, 255, 255, 0.82)',
  },
  formPanel: {
    marginTop: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(26, 20, 18, 0.62)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
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
  error: {
    fontSize: typography.sizeSm,
    color: '#FCA5A5',
  },
  forgotLinkWrap: {
    alignSelf: 'flex-end',
    marginTop: -spacing.xs,
  },
  forgotLink: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightSemibold,
    color: colors.accentSoft,
  },
});
