import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Button } from '../../../../shared/ui/Button';
import { ModalCloseButton } from '../../../../shared/ui/ModalCloseButton';
import { Text } from '../../../../shared/ui/Text';
import { colors, overlay, radius, spacing, typography } from '../../../../shared/theme/tokens';
import { useAuthContext } from '../../application/AuthProvider';
import { useAuthFlow, type AuthMode } from '../../application/useAuthFlow';
import { usePasswordReset } from '../../application/usePasswordReset';
import { gatedActionLabel } from '../../domain/gatedActions';
import { AuthErrorBanner } from './AuthErrorBanner';
import { AuthLegalFooter } from './AuthLegalFooter';
import { EmailAuthForm } from './EmailAuthForm';
import { ForgotPasswordForm } from './ForgotPasswordForm';
import { LoginAuthButton } from './LoginAuthButton';

type Step = 'choose' | 'email' | 'forgot';

function titleFor(step: Step, mode: AuthMode, actionLabel: string): string {
  if (step === 'forgot') return 'Reset password';
  if (step === 'email') return mode === 'sign_up' ? 'Create your account' : 'Sign in with email';
  return `Continue to ${actionLabel}`;
}

/** The sign-in sheet a guest sees when they reach for something that needs an account. */
export function SoftAuthModal() {
  const { softAuthRequest, dismissSoftAuth, completeSoftAuth } = useAuthContext();
  const flow = useAuthFlow({ onSignedIn: completeSoftAuth });
  const passwordReset = usePasswordReset();
  const { clearResetState: clearPasswordReset } = passwordReset;
  const { clearError } = flow;

  const visible = softAuthRequest !== null;
  const action = softAuthRequest?.action ?? 'vault_save';

  const [step, setStep] = useState<Step>('choose');
  const [mode, setMode] = useState<AuthMode>('sign_in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (!visible) {
      setStep('choose');
      setMode('sign_in');
      setEmail('');
      setPassword('');
      clearError();
      clearPasswordReset();
    }
  }, [visible, clearError, clearPasswordReset]);

  const goTo = (next: Step, nextMode: AuthMode = mode) => {
    setStep(next);
    setMode(nextMode);
    clearError();
    clearPasswordReset();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={dismissSoftAuth}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.backdrop} onPress={dismissSoftAuth}>
          <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.sheetContent}
            >
              <View style={styles.sheetTop}>
                <ModalCloseButton onPress={dismissSoftAuth} accessibilityLabel="Close sign in" />
              </View>
              <Text style={styles.title}>{titleFor(step, mode, gatedActionLabel(action))}</Text>
              {step === 'choose' ? (
                <Text style={styles.body}>
                  {action === 'create_link'
                    ? 'Your card stays exactly as you made it. Sign in and your link is ready — your first card is free.'
                    : 'Signing in saves your Vault and History.'}
                </Text>
              ) : null}

              {step === 'choose' ? (
                <View style={styles.form}>
                  {flow.error ? <AuthErrorBanner message={flow.error} /> : null}
                  {flow.canSignInWithApple ? (
                    <LoginAuthButton
                      provider="apple"
                      label="Continue with Apple"
                      onPress={() => void flow.continueWithApple()}
                      loading={flow.pendingProvider === 'apple'}
                      disabled={flow.isLoading}
                    />
                  ) : null}
                  <LoginAuthButton
                    provider="google"
                    label="Continue with Google"
                    onPress={() => void flow.continueWithGoogle()}
                    loading={flow.pendingProvider === 'google'}
                    disabled={flow.isLoading}
                  />
                  <LoginAuthButton
                    provider="email"
                    label="Continue with email"
                    onPress={() => goTo('email', 'sign_in')}
                    disabled={flow.isLoading}
                  />
                  <Button
                    label="New here? Create account"
                    variant="ghost"
                    onPress={() => goTo('email', 'sign_up')}
                    disabled={flow.isLoading}
                  />
                </View>
              ) : step === 'forgot' ? (
                <View style={styles.form}>
                  <ForgotPasswordForm
                    emailInput={email}
                    onEmailChange={setEmail}
                    resetSent={passwordReset.resetSent}
                    successCopy={passwordReset.successCopy}
                    error={passwordReset.error}
                    isLoading={passwordReset.isLoading}
                    canResend={passwordReset.canResend}
                    resendLabel={passwordReset.resendLabel}
                    onSend={() => void passwordReset.sendReset(email)}
                    onResend={() => void passwordReset.sendReset(email)}
                    onBackToSignIn={() => goTo('email', 'sign_in')}
                    onUseDifferentEmail={passwordReset.clearResetState}
                  />
                  {!passwordReset.resetSent ? (
                    <Button
                      label="Back"
                      variant="ghost"
                      onPress={() => goTo('email', 'sign_in')}
                      disabled={passwordReset.isLoading}
                    />
                  ) : null}
                </View>
              ) : (
                <View style={styles.form}>
                  <EmailAuthForm
                    mode={mode}
                    email={email}
                    onEmailChange={(value) => {
                      setEmail(value);
                      clearError();
                    }}
                    password={password}
                    onPasswordChange={(value) => {
                      setPassword(value);
                      clearError();
                    }}
                    isLoading={flow.isLoading}
                    formError={flow.error}
                    onSubmit={() => void flow.submitEmail(mode, email, password)}
                    onForgotPassword={() => goTo('forgot', 'sign_in')}
                    onSwitchMode={() => goTo('email', mode === 'sign_up' ? 'sign_in' : 'sign_up')}
                  />
                  <Button
                    label="Back"
                    variant="ghost"
                    onPress={() => goTo('choose', 'sign_in')}
                    disabled={flow.isLoading}
                  />
                </View>
              )}

              {/* Terms and Privacy must be one tap away wherever an account can be created. */}
              <AuthLegalFooter />
            </ScrollView>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    backgroundColor: overlay.scrim,
    justifyContent: 'flex-end',
    padding: spacing.lg,
  },
  sheet: {
    maxHeight: '92%',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sheetContent: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  sheetTop: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: -spacing.xs,
    marginBottom: -spacing.xs,
    marginHorizontal: -spacing.xs,
  },
  title: {
    fontSize: typography.sizeXl,
    lineHeight: typography.sizeXl * 1.15,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
    letterSpacing: -0.4,
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
});
