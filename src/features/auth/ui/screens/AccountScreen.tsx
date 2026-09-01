import { StyleSheet, View } from 'react-native';
import { Button } from '../../../../shared/ui/Button';
import { Screen } from '../../../../shared/ui/Screen';
import { ScreenActions } from '../../../../shared/ui/ScreenActions';
import { ScreenHeaderAction } from '../../../../shared/ui/ScreenHeaderAction';
import { Text } from '../../../../shared/ui/Text';
import { colors, radius, spacing, typography } from '../../../../shared/theme/tokens';
import { useAuth } from '../../application/useAuth';
import { formatAuthIdentity } from '../../domain/mapUser';

export function AccountScreen() {
  const { user, isSignedIn, isLoading, requestAuth, signOutUser } = useAuth();

  return (
    <Screen
      title="Account"
      subtitle={isSignedIn ? 'Your Occasio profile' : 'Guest mode — create freely'}
      headerAction={
        !isLoading && !isSignedIn ? (
          <ScreenHeaderAction
            label="Sign in"
            onPress={() => requestAuth('subscription_manage', () => undefined)}
          />
        ) : undefined
      }
    >
      {isLoading ? (
        <Text style={styles.muted}>Checking session…</Text>
      ) : isSignedIn && user ? (
        <View style={styles.card}>
          <Text style={styles.label}>Signed in as</Text>
          <Text style={styles.value}>{formatAuthIdentity(user)}</Text>
          {user.email ? (
            <Text style={styles.hint}>{user.email}</Text>
          ) : null}
          <Text style={styles.hint}>
            Vault, synced history, and plans unlock after sign-in.
          </Text>
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.guestTitle}>You&apos;re browsing as a guest</Text>
          <Text style={styles.hint}>
            Create and share cards without an account. Sign in with Google or email when you
            want to save people, sync history, or manage a subscription.
          </Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Plans</Text>
        <View style={styles.planCard}>
          <Text style={styles.planName}>Free</Text>
          <Text style={styles.planDetail}>1 card / month · 30-day links</Text>
        </View>
        <View style={[styles.planCard, styles.planCardMuted]}>
          <Text style={styles.planName}>Plus</Text>
          <Text style={styles.planDetail}>Unlimited cards · 365-day links · Vault</Text>
          <Text style={styles.comingSoon}>Billing via App Store / Play — coming soon</Text>
        </View>
      </View>

      {!isLoading && isSignedIn ? (
        <ScreenActions align="start">
          <Button
            label="Sign out"
            variant="ghost"
            onPress={() => void signOutUser()}
          />
        </ScreenActions>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  muted: {
    fontSize: typography.sizeSm,
    color: colors.muted,
  },
  card: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  label: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightSemibold,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  value: {
    fontSize: typography.sizeLg,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
  },
  guestTitle: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
  },
  hint: {
    marginTop: spacing.xs,
    fontSize: typography.sizeSm,
    lineHeight: typography.sizeSm * 1.45,
    color: colors.inkSoft,
  },
  section: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightSemibold,
    color: colors.inkSoft,
  },
  planCard: {
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.xs,
  },
  planCardMuted: {
    backgroundColor: colors.sidebar,
  },
  planName: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
  },
  planDetail: {
    fontSize: typography.sizeSm,
    color: colors.inkSoft,
  },
  comingSoon: {
    fontSize: typography.sizeXs,
    color: colors.muted,
    marginTop: spacing.xs,
  },
});
