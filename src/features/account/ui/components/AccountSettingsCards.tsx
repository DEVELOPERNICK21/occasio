import { useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet, Switch, View } from 'react-native';
import {
  canCollectAnalytics,
  setAnalyticsConsent,
  subscribeAnalyticsConsent,
} from '../../../../shared/analytics/consent';
import { env } from '../../../../shared/config/env';
import { Text } from '../../../../shared/ui/Text';
import { colors, radius, spacing, typography } from '../../../../shared/theme/tokens';
import type { SubscriptionTier } from '../../../billing/domain/types';
import { balanceRows, type BalanceRow, type WishBalance } from '../../../billing/domain/wishBalance';
import {
  subscriptionAmountLabel,
  subscriptionPaymentLabel,
  subscriptionStatusCopy,
} from '../../domain/accountProfile';

type SubscriptionProps = {
  tier: SubscriptionTier;
  /** What the person has left and bought. Without it (a guest, or not read yet) the plain plan summary shows. */
  balance?: WishBalance | null;
  onManagePlan: () => void;
  onRestorePurchases?: () => void;
  isRestoring?: boolean;
};

/** One line of "what you have": a label, the value, a note, and a bar when it is a count of something. */
function BalanceRowView({ row }: { row: BalanceRow }) {
  return (
    <View style={styles.balanceRow}>
      <View style={styles.balanceTop}>
        <Text style={styles.metricLabel}>{row.label.toUpperCase()}</Text>
        <Text style={styles.metricValue}>{row.value}</Text>
      </View>
      {row.progress !== undefined ? (
        <View
          style={styles.balanceBar}
          accessibilityRole="progressbar"
          accessibilityLabel={`${row.label}: ${row.value}`}
          accessibilityValue={{ min: 0, max: 100, now: Math.round(row.progress * 100) }}
        >
          <View style={[styles.balanceFill, { width: `${Math.max(3, row.progress * 100)}%` }]} />
        </View>
      ) : null}
      {row.note ? <Text style={styles.balanceNote}>{row.note}</Text> : null}
    </View>
  );
}

export function AccountSubscriptionCard({
  tier,
  balance = null,
  onManagePlan,
  onRestorePurchases,
  isRestoring = false,
}: SubscriptionProps) {
  return (
    <View style={styles.card}>
      <View style={[styles.cardHeader, styles.cardHeaderSpread]}>
        <Text style={styles.cardTitle}>{balance ? 'Your plan and wishes' : 'Subscription'}</Text>
        <View style={styles.iconBadge}>
          <Text style={styles.iconBadgeText}>🏷</Text>
        </View>
      </View>
      <Text style={styles.body}>{subscriptionStatusCopy(tier)}</Text>

      {balance ? (
        <View style={styles.balanceRows}>
          {balanceRows(balance).map((row) => (
            <BalanceRowView key={row.label} row={row} />
          ))}
        </View>
      ) : (
        <View style={styles.metrics}>
          <View style={styles.metric}>
            <View style={[styles.metricRail, { backgroundColor: colors.tertiary }]} />
            <View style={styles.metricCopy}>
              <Text style={styles.metricLabel}>NEXT PAYMENT</Text>
              <Text style={styles.metricValue}>{subscriptionPaymentLabel(tier)}</Text>
            </View>
          </View>
          <View style={styles.metric}>
            <View style={[styles.metricRail, { backgroundColor: colors.tertiary }]} />
            <View style={styles.metricCopy}>
              <Text style={styles.metricLabel}>AMOUNT</Text>
              <Text style={styles.metricValue}>{subscriptionAmountLabel(tier)}</Text>
            </View>
          </View>
        </View>
      )}

      <Pressable
        accessibilityRole="button"
        onPress={onManagePlan}
        style={({ pressed }) => [styles.manageButton, pressed && styles.pressed]}
      >
        <Text style={styles.manageLabel}>
          {tier === 'free' ? 'See Occasio Pro' : 'Cancel or manage subscription'}
        </Text>
      </Pressable>
      {onRestorePurchases ? (
        <Pressable
          accessibilityRole="button"
          disabled={isRestoring}
          onPress={onRestorePurchases}
          style={({ pressed }) => [styles.restoreButton, pressed && styles.pressed]}
        >
          <Text style={styles.restoreLabel}>
            {isRestoring ? 'Restoring…' : 'Restore purchases'}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/** A way into the badges screen from the profile. */
export function AccountBadgesCard({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Your badges"
      onPress={onPress}
      style={({ pressed }) => [styles.card, styles.badgesCard, pressed && styles.pressed]}
    >
      <View style={styles.badgesCopy}>
        <Text style={styles.cardTitle}>Your badges</Text>
        <Text style={styles.body}>See what you have earned, and what comes next.</Text>
      </View>
      <Text style={styles.badgesChevron}>›</Text>
    </Pressable>
  );
}

/**
 * Notification delivery is controlled by the OS permission, not by in-app
 * switches, so this card says that instead of showing controls that do nothing.
 */
export function AccountNotificationsCard() {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardIcon}>🔔</Text>
        <Text style={styles.cardTitle}>Notifications</Text>
      </View>
      <Text style={styles.body}>
        Occasio can notify you when a card you saved for someone is ready to review. Turn
        notifications on or off for Occasio in your phone settings.
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          void Linking.openSettings();
        }}
      >
        <Text style={styles.link}>Open phone settings →</Text>
      </Pressable>
    </View>
  );
}

const SUPPORT_EMAIL = 'developernick1@gmail.com';

export function AccountPrivacyCard() {
  const [crashReports, setCrashReports] = useState(canCollectAnalytics());
  useEffect(
    () => subscribeAnalyticsConsent((value) => setCrashReports(value === 'granted')),
    [],
  );

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardIcon}>🛡</Text>
        <Text style={styles.cardTitle}>Privacy and terms</Text>
      </View>
      <Text style={styles.body}>
        See what Occasio collects, how long it is kept, and how to delete it.
      </Text>
      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>Share usage and crash reports</Text>
        <Switch
          accessibilityLabel="Share usage and crash reports"
          value={crashReports}
          onValueChange={(next) => {
            void setAnalyticsConsent(next);
          }}
          trackColor={{ false: colors.border, true: colors.accent }}
          thumbColor={colors.white}
        />
      </View>
      <Text style={styles.body}>
        Off unless you turn it on. Sends which steps you use (for example "card shared") and,
        if the app crashes, your phone model, app version and account ID. Never your cards,
        photos, messages or contacts, and no advertising ID.
      </Text>
      <View style={styles.helpActions}>
        <Pressable
          accessibilityRole="link"
          onPress={() => {
            void Linking.openURL(`${env.shareBaseUrl}/privacy`);
          }}
          style={styles.helpButton}
        >
          <Text style={styles.helpButtonLabel}>Privacy Policy</Text>
        </Pressable>
        <Pressable
          accessibilityRole="link"
          onPress={() => {
            void Linking.openURL(`${env.shareBaseUrl}/terms`);
          }}
          style={styles.helpButton}
        >
          <Text style={styles.helpButtonLabel}>Terms of Service</Text>
        </Pressable>
        <Pressable
          accessibilityRole="link"
          onPress={() => {
            void Linking.openURL(`${env.shareBaseUrl}/dmca`);
          }}
          style={styles.helpButton}
        >
          <Text style={styles.helpButtonLabel}>Copyright</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function AccountHelpCard() {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardIcon}>?</Text>
        <Text style={styles.cardTitle}>Help and support</Text>
      </View>
      <Text style={styles.body}>
        Something not working, or a question about your card or plan? Email us and we will
        reply.
      </Text>
      <View style={styles.helpActions}>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            void Linking.openURL(`mailto:${SUPPORT_EMAIL}`);
          }}
          style={styles.helpButton}
        >
          <Text style={styles.helpButtonLabel}>Email support</Text>
        </Pressable>
        <Pressable
          accessibilityRole="link"
          onPress={() => {
            void Linking.openURL(`${env.shareBaseUrl}/delete-account`);
          }}
          style={styles.helpButton}
        >
          <Text style={styles.helpButtonLabel}>Delete my data</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function AccountSignOutButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.signOut, pressed && styles.pressed]}
    >
      <Text style={styles.signOutIcon}>↪</Text>
      <Text style={styles.signOutLabel}>SIGN OUT FROM OCCASIO</Text>
    </Pressable>
  );
}

export function AccountDeleteButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.deleteAccount, pressed && styles.pressed]}
    >
      <Text style={styles.deleteAccountLabel}>Delete account and data</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardHeaderSpread: {
    justifyContent: 'space-between',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardIcon: {
    fontSize: typography.sizeMd,
    color: colors.accent,
    width: 20,
    textAlign: 'center',
  },
  cardTitle: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.sidebar,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBadgeText: {
    fontSize: 14,
  },
  body: {
    fontSize: typography.sizeSm,
    lineHeight: typography.sizeSm * 1.5,
    color: colors.inkSoft,
  },
  metrics: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  balanceRows: {
    gap: spacing.md,
  },
  balanceRow: {
    gap: spacing.xs,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  balanceTop: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  balanceBar: {
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.sidebar,
    overflow: 'hidden',
  },
  balanceFill: {
    height: '100%',
    borderRadius: radius.full,
    backgroundColor: colors.accent,
  },
  balanceNote: {
    fontSize: typography.sizeXs,
    lineHeight: typography.sizeXs * 1.4,
    color: colors.muted,
  },
  badgesCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  badgesCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  badgesChevron: {
    fontSize: typography.sizeLg,
    color: colors.muted,
  },
  metric: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  metricRail: {
    width: 3,
    alignSelf: 'stretch',
    borderRadius: radius.full,
    minHeight: 40,
  },
  metricCopy: {
    flex: 1,
    gap: 4,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: typography.weightSemibold,
    letterSpacing: 0.6,
    color: colors.muted,
  },
  metricValue: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
  },
  manageButton: {
    minHeight: 48,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manageLabel: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightSemibold,
    color: colors.white,
  },
  restoreButton: {
    minHeight: 44,
    marginTop: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restoreLabel: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightMedium,
    color: colors.inkSoft,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  toggleLabel: {
    fontSize: typography.sizeSm,
    color: colors.ink,
  },
  link: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightSemibold,
    color: colors.accent,
  },
  chevron: {
    fontSize: typography.sizeXl,
    color: colors.muted,
  },
  badges: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  badge: {
    flex: 1,
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.sidebar,
    gap: 4,
  },
  badgeLabel: {
    fontSize: 10,
    fontWeight: typography.weightSemibold,
    letterSpacing: 0.5,
    color: colors.muted,
  },
  badgeValue: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
  },
  // Pills size to their label and wrap onto a second row when the line is full, so a
  // longer label ("Terms of Service") is never squeezed out of its own button.
  helpActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  helpButton: {
    flexGrow: 1,
    minHeight: 40,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpButtonLabel: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightSemibold,
    color: colors.accent,
  },
  signOut: {
    minHeight: 52,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.accent,
    backgroundColor: colors.bg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  signOutIcon: {
    fontSize: typography.sizeMd,
    color: colors.accent,
  },
  signOutLabel: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightSemibold,
    letterSpacing: 0.8,
    color: colors.accent,
  },
  deleteAccount: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteAccountLabel: {
    fontSize: typography.sizeSm,
    color: colors.muted,
    textDecorationLine: 'underline',
  },
  pressed: {
    opacity: 0.92,
  },
});
