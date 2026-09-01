import { StyleSheet, View } from 'react-native';
import { Screen } from '../../../../shared/ui/Screen';
import { ScreenHeaderAction } from '../../../../shared/ui/ScreenHeaderAction';
import { Text } from '../../../../shared/ui/Text';
import { colors, radius, spacing, typography } from '../../../../shared/theme/tokens';
import { useRequireAuth } from '../../application/useAuth';
import type { GatedAction } from '../../domain/types';

type Props = {
  title: string;
  message: string;
  action: GatedAction;
  signedInMessage?: string;
};

/** Placeholder for Vault / History until those features ship. */
export function GuestGateScreen({ title, message, action, signedInMessage }: Props) {
  const { requireAuth, isSignedIn } = useRequireAuth();

  return (
    <Screen
      title={title}
      subtitle={isSignedIn ? signedInMessage : 'Sign in to unlock'}
      headerAction={
        isSignedIn ? undefined : (
          <ScreenHeaderAction
            label="Sign in"
            onPress={() => requireAuth(action, () => undefined)}
          />
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
