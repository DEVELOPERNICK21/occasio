import { StyleSheet, View } from 'react-native';
import { Screen } from './Screen';
import { ScreenHeaderAction } from './ScreenHeaderAction';
import { Text } from './Text';
import { colors, radius, spacing, typography } from '../theme/tokens';

type Props = {
  title: string;
  message: string;
  isSignedIn: boolean;
  onSignIn: () => void;
  signedInMessage?: string;
};

/** Shared gate for tabs that require sign-in — no feature ui imports. */
export function GuestGateScreen({
  title,
  message,
  isSignedIn,
  onSignIn,
  signedInMessage,
}: Props) {
  return (
    <Screen
      title={title}
      subtitle={isSignedIn ? signedInMessage : 'Sign in to unlock'}
      headerAction={
        isSignedIn ? undefined : (
          <ScreenHeaderAction label="Sign in / Create" onPress={onSignIn} />
        )
      }
    >
      <View style={styles.card}>
        <Text style={styles.body}>{message}</Text>
        {isSignedIn ? (
          <Text style={styles.soon}>Coming in the next build slice.</Text>
        ) : (
          <Text style={styles.hint}>
            You can still create and share cards as a guest — no account needed.
          </Text>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  body: {
    fontSize: typography.sizeMd,
    color: colors.inkSoft,
    lineHeight: typography.sizeMd * 1.45,
  },
  hint: {
    fontSize: typography.sizeSm,
    color: colors.muted,
    lineHeight: typography.sizeSm * 1.4,
  },
  soon: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightSemibold,
    color: colors.accent,
  },
});
