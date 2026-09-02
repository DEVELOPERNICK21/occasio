import { useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useScrollToTop } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FLOATING_TAB_BAR_HEIGHT } from '../../../../shared/navigation/tabBarConstants';
import { Text } from '../../../../shared/ui/Text';
import { colors, radius, spacing, typography } from '../../../../shared/theme/tokens';
import type { SubscriptionTier } from '../../../vault/domain/types';
import {
  memberSinceLabel,
  profileBio,
  tierDisplayLabel,
} from '../../domain/accountProfile';
import type { AuthUser } from '../../domain/types';
import {
  AccountProfileHero,
  AccountTopBar,
} from '../components/AccountProfileHeader';
import {
  AccountHelpCard,
  AccountNotificationsCard,
  AccountPrivacyCard,
  AccountSignOutButton,
  AccountSubscriptionCard,
} from '../components/AccountSettingsCards';

type Props = {
  user: AuthUser;
  tier?: SubscriptionTier;
  onSignOut: () => void;
};

export function AccountHomeScreen({ user, tier = 'free', onSignOut }: Props) {
  const scrollRef = useRef<ScrollView>(null);
  useScrollToTop(scrollRef);

  const insets = useSafeAreaInsets();
  const [momentAlerts, setMomentAlerts] = useState(true);
  const [planUpdates, setPlanUpdates] = useState(true);
  const [marketInsights, setMarketInsights] = useState(false);

  const handleManagePlan = () => {
    Alert.alert(
      'Manage plan',
      'Store billing is coming soon. You are on the Free tier for now.',
    );
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + FLOATING_TAB_BAR_HEIGHT + spacing.lg },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <AccountTopBar user={user} />
        <AccountProfileHero user={user} />

        <View style={styles.metaRow}>
          <View style={styles.tierBadge}>
            <Text style={styles.tierBadgeText}>{tierDisplayLabel(tier)}</Text>
          </View>
          <Text style={styles.memberSince}>{memberSinceLabel(user.createdAt)}</Text>
        </View>

        <Text style={styles.bio}>{profileBio(user)}</Text>

        <AccountSubscriptionCard tier={tier} onManagePlan={handleManagePlan} />

        <AccountNotificationsCard
          momentAlerts={momentAlerts}
          planUpdates={planUpdates}
          marketInsights={marketInsights}
          onMomentAlertsChange={setMomentAlerts}
          onPlanUpdatesChange={setPlanUpdates}
          onMarketInsightsChange={setMarketInsights}
        />

        <AccountPrivacyCard />
        <AccountHelpCard />
        <AccountSignOutButton onPress={onSignOut} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: -spacing.sm,
  },
  tierBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: colors.sidebar,
  },
  tierBadgeText: {
    fontSize: 10,
    fontWeight: typography.weightSemibold,
    letterSpacing: 0.6,
    color: colors.accent,
  },
  memberSince: {
    fontSize: typography.sizeXs,
    color: colors.muted,
  },
  bio: {
    fontSize: typography.sizeSm,
    lineHeight: typography.sizeSm * 1.55,
    color: colors.inkSoft,
    textAlign: 'center',
    paddingHorizontal: spacing.sm,
    marginTop: -spacing.sm,
  },
});
