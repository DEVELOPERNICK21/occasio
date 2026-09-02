import { Alert, Linking, Pressable, StyleSheet, View } from 'react-native';
import { env } from '../../../../shared/config/env';
import { Text } from '../../../../shared/ui/Text';
import { colors, radius, spacing, typography } from '../../../../shared/theme/tokens';
import type { SubscriptionTier } from '../../../vault/domain/types';
import {
  subscriptionAmountLabel,
  subscriptionPaymentLabel,
  subscriptionStatusCopy,
} from '../../domain/accountProfile';
import { AccountToggle } from './AccountToggle';

type SubscriptionProps = {
  tier: SubscriptionTier;
  onManagePlan: () => void;
};

export function AccountSubscriptionCard({ tier, onManagePlan }: SubscriptionProps) {
  return (
    <View style={styles.card}>
      <View style={[styles.cardHeader, styles.cardHeaderSpread]}>
        <Text style={styles.cardTitle}>Subscription</Text>
        <View style={styles.iconBadge}>
          <Text style={styles.iconBadgeText}>🏷</Text>
        </View>
      </View>
      <Text style={styles.body}>{subscriptionStatusCopy(tier)}</Text>

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

      <Pressable
        accessibilityRole="button"
        onPress={onManagePlan}
        style={({ pressed }) => [styles.manageButton, pressed && styles.pressed]}
      >
        <Text style={styles.manageLabel}>Manage Plan</Text>
      </Pressable>
    </View>
  );
}

type ToggleRowProps = {
  label: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
};

function ToggleRow({ label, value, onValueChange }: ToggleRowProps) {
  return (
    <View style={styles.toggleRow}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <AccountToggle value={value} onValueChange={onValueChange} />
    </View>
  );
}

type NotificationsProps = {
  momentAlerts: boolean;
  planUpdates: boolean;
  marketInsights: boolean;
  onMomentAlertsChange: (next: boolean) => void;
  onPlanUpdatesChange: (next: boolean) => void;
  onMarketInsightsChange: (next: boolean) => void;
};

export function AccountNotificationsCard({
  momentAlerts,
  planUpdates,
  marketInsights,
  onMomentAlertsChange,
  onPlanUpdatesChange,
  onMarketInsightsChange,
}: NotificationsProps) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardIcon}>🔔</Text>
        <Text style={styles.cardTitle}>Notifications</Text>
      </View>
      <ToggleRow label="Moment Alerts" value={momentAlerts} onValueChange={onMomentAlertsChange} />
      <ToggleRow label="Plan Updates" value={planUpdates} onValueChange={onPlanUpdatesChange} />
      <ToggleRow
        label="Market Insights"
        value={marketInsights}
        onValueChange={onMarketInsightsChange}
      />
      <Pressable accessibilityRole="button" onPress={() => Alert.alert('Notification settings', 'Fine-grained controls are coming soon.')}>
        <Text style={styles.link}>Notification Settings →</Text>
      </Pressable>
    </View>
  );
}

export function AccountPrivacyCard() {
  const openPrivacy = () => {
    void Linking.openURL(`${env.shareBaseUrl}/privacy`);
  };

  return (
    <Pressable accessibilityRole="button" onPress={openPrivacy} style={styles.card}>
      <View style={styles.cardHeaderRow}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardIcon}>🛡</Text>
          <Text style={styles.cardTitle}>Privacy</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </View>
      <Text style={styles.body}>
        Manage how your data is used and how you appear to other members of the
        Occasio circle.
      </Text>
      <View style={styles.badges}>
        <View style={styles.badge}>
          <Text style={styles.badgeLabel}>STATUS</Text>
          <Text style={styles.badgeValue}>Private</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeLabel}>ENCRYPTION</Text>
          <Text style={styles.badgeValue}>Enabled</Text>
        </View>
      </View>
    </Pressable>
  );
}

export function AccountHelpCard() {
  const openHelp = () => {
    void Linking.openURL(`${env.shareBaseUrl}/privacy`);
  };

  return (
    <View style={styles.card}>
      <Pressable accessibilityRole="button" onPress={openHelp} style={styles.cardHeaderRow}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardIcon}>?</Text>
          <Text style={styles.cardTitle}>Help & Support</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </Pressable>
      <Text style={styles.body}>
        Our dedicated concierge team is available 24/7 to assist with your
        milestones and account needs.
      </Text>
      <View style={styles.helpActions}>
        <Pressable
          accessibilityRole="button"
          onPress={() => Linking.openURL('mailto:develoepernick1@gmail.com')}
          style={styles.helpButton}
        >
          <Text style={styles.helpButtonLabel}>Chat Now</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={openHelp} style={styles.helpButton}>
          <Text style={styles.helpButtonLabel}>Help Center</Text>
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
  helpActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  helpButton: {
    flex: 1,
    minHeight: 40,
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
  pressed: {
    opacity: 0.92,
  },
});
