import { useIsFocused } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import {
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PipFriend } from '../../../../shared/ui/PipFriend';
import { Text } from '../../../../shared/ui/Text';
import { colors, spacing, typography } from '../../../../shared/theme/tokens';
import { useAuthFlow, type AuthMode } from '../../application/useAuthFlow';
import { usePasswordReset } from '../../application/usePasswordReset';
import { AuthBackdrop } from '../components/AuthBackdrop';
import { AuthErrorBanner } from '../components/AuthErrorBanner';
import { AuthLegalFooter } from '../components/AuthLegalFooter';
import { EmailAuthForm } from '../components/EmailAuthForm';
import { ForgotPasswordForm } from '../components/ForgotPasswordForm';
import { LoginAuthButton } from '../components/LoginAuthButton';

type Step = 'welcome' | 'email' | 'forgot';

type Props = {
  /** Return to guest browsing: shown as a back control on the first step. */
  onDismiss?: () => void;
};

const PIP_HERO = 176;
const PIP_STEP = 76;

/** Dark status icons on the light page, only while this tab is showing (tabs stay mounted). */
function LoginStatusBar() {
  const focused = useIsFocused();
  return focused ? <StatusBar barStyle="dark-content" /> : null;
}

function BackControl({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={8}
      style={styles.back}
    >
      <ArrowLeft size={20} color={colors.ink} strokeWidth={2.2} absoluteStrokeWidth />
      <Text style={styles.backLabel}>{label}</Text>
    </Pressable>
  );
}

function OrDivider() {
  return (
    <View style={styles.divider} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={styles.dividerLine} />
      <Text style={styles.dividerText}>or</Text>
      <View style={styles.dividerLine} />
    </View>
  );
}

/**
 * Sign in: Pip says hello, then Apple, Google or email. No photo behind it, so it
 * looks like the rest of the app. The email step has what people expect of a
 * password form (an eye to show it, the keyboard moving on, mistakes named).
 */
export function LoginScreen({ onDismiss }: Props) {
  const insets = useSafeAreaInsets();
  const focused = useIsFocused();
  const flow = useAuthFlow();
  const passwordReset = usePasswordReset();

  const [step, setStep] = useState<Step>('welcome');
  const [mode, setMode] = useState<AuthMode>('sign_in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const goTo = (next: Step, nextMode: AuthMode = mode) => {
    setStep(next);
    setMode(nextMode);
    flow.clearError();
    passwordReset.clearResetState();
  };

  const goBack = () => {
    if (step === 'forgot') goTo('email', 'sign_in');
    else goTo('welcome', 'sign_in');
  };

  // The phone's own back button steps back through this flow instead of leaving it.
  useEffect(() => {
    if (!focused || step === 'welcome') return undefined;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (step === 'forgot') goTo('email', 'sign_in');
      else goTo('welcome', 'sign_in');
      return true;
    });
    return () => subscription.remove();
    // `goTo` only reads state through setters, so the step is the only thing that matters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focused, step]);

  const isSignUp = mode === 'sign_up';
  const topPad = insets.top + spacing.sm;

  return (
    <View style={styles.root}>
      <LoginStatusBar />
      <AuthBackdrop />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingTop: topPad, paddingBottom: insets.bottom + spacing.lg }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {step === 'welcome' ? (
            <>
              {onDismiss ? <BackControl label="Back" onPress={onDismiss} /> : <View style={styles.backSpacer} />}

              <View style={styles.hero}>
                <PipFriend spot="loginWelcome" size={PIP_HERO} />
                <Text style={styles.brand}>Occasio</Text>
                <Text style={styles.tagline}>Cards they’ll want to open.</Text>
              </View>

              <View style={styles.actions}>
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
                <OrDivider />
                <LoginAuthButton
                  provider="email"
                  label="Continue with email"
                  onPress={() => goTo('email', 'sign_in')}
                  disabled={flow.isLoading}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Create an account"
                  disabled={flow.isLoading}
                  onPress={() => goTo('email', 'sign_up')}
                  hitSlop={8}
                  style={styles.createWrap}
                >
                  <Text style={styles.createText}>
                    New here? <Text style={styles.createLink}>Create an account</Text>
                  </Text>
                </Pressable>
              </View>

              <View style={styles.footer}>
                <AuthLegalFooter />
              </View>
            </>
          ) : step === 'email' ? (
            <>
              <BackControl label="Back" onPress={goBack} />
              <View style={styles.stepHeader}>
                <PipFriend
                  spot={isSignUp ? 'loginSignUp' : 'loginSignIn'}
                  variant="inline"
                  size={PIP_STEP}
                />
                <Text style={styles.title}>{isSignUp ? 'Create your account' : 'Sign in with email'}</Text>
                <Text style={styles.body}>
                  {isSignUp
                    ? 'Your Vault and History stay with you on every device.'
                    : 'Use the email and password you signed up with.'}
                </Text>
              </View>
              <EmailAuthForm
                mode={mode}
                email={email}
                onEmailChange={(value) => {
                  setEmail(value);
                  flow.clearError();
                }}
                password={password}
                onPasswordChange={(value) => {
                  setPassword(value);
                  flow.clearError();
                }}
                isLoading={flow.isLoading}
                formError={flow.error}
                onSubmit={() => void flow.submitEmail(mode, email, password)}
                onForgotPassword={() => goTo('forgot', 'sign_in')}
                onSwitchMode={() => goTo('email', isSignUp ? 'sign_in' : 'sign_up')}
              />
              <View style={styles.footer}>
                <AuthLegalFooter />
              </View>
            </>
          ) : (
            <>
              <BackControl label="Back" onPress={goBack} />
              <View style={styles.stepHeader}>
                <PipFriend spot="loginForgot" variant="inline" size={PIP_STEP} />
                <Text style={styles.title}>Reset your password</Text>
                <Text style={styles.body}>
                  Enter the email for your account. We will send a link to choose a new password.
                </Text>
              </View>
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
              <View style={styles.footer}>
                <AuthLegalFooter />
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  back: {
    alignSelf: 'flex-start',
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  backSpacer: {
    height: spacing.sm,
  },
  backLabel: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    // Room above Pip for the line he says when tapped.
    paddingTop: spacing.xl,
  },
  brand: {
    marginTop: spacing.sm,
    fontSize: typography.size2xl,
    lineHeight: typography.size2xl * 1.1,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
    letterSpacing: -0.6,
  },
  tagline: {
    fontSize: typography.sizeMd,
    lineHeight: typography.sizeMd * 1.45,
    color: colors.inkSoft,
    textAlign: 'center',
  },
  actions: {
    width: '100%',
    maxWidth: 380,
    alignSelf: 'center',
    gap: spacing.md,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontSize: typography.sizeSm,
    color: colors.muted,
  },
  createWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  createText: {
    fontSize: typography.sizeSm,
    color: colors.inkSoft,
  },
  createLink: {
    fontWeight: typography.weightSemibold,
    color: colors.accentHover,
  },
  stepHeader: {
    gap: spacing.sm,
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
  footer: {
    marginTop: 'auto',
    paddingTop: spacing.md,
  },
});
