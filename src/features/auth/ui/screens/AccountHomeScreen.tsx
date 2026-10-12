import { useRef, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useScrollToTop } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FLOATING_TAB_BAR_HEIGHT } from '../../../../shared/navigation/tabBarConstants';
import { BusyOverlay } from '../../../../shared/ui/BusyOverlay';
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
  AccountDeleteButton,
  AccountHelpCard,
  AccountNotificationsCard,
  AccountPrivacyCard,
  AccountSignOutButton,
  AccountSubscriptionCard,
} from '../components/AccountSettingsCards';

type Props = {
  user: AuthUser;
  tier?: SubscriptionTier;
  hasPro?: boolean;
  isRestoring?: boolean;
  onRestorePurchases?: () => void;
  onManagePlan?: () => void;
  onSignOut: () => void;
  onDeleteAccount?: () => Promise<void>;
};

export function AccountHomeScreen({
  user,
  tier = 'free',
  hasPro = false,
  isRestoring = false,
  onRestorePurchases,
  onManagePlan,
  onSignOut,
  onDeleteAccount,
}: Props) {
  const scrollRef = useRef<ScrollView>(null);
  useScrollToTop(scrollRef);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const insets = useSafeAreaInsets();
  const storeName = Platform.OS === 'ios' ? 'the App Store' : 'Google Play';
  const hasSubscription = hasPro || tier !== 'free';

  const handleManagePlan = () => {
    if (onManagePlan) {
      onManagePlan();
      return;
    }

    Alert.alert(
      hasPro || tier !== 'free' ? 'Your plan' : 'Upgrade',
      hasPro || tier !== 'free'
        ? `Manage or cancel your subscription in ${storeName}.`
        : 'Open Create and generate a link to see Occasio Pro plans.',
    );
  };

  const confirmDelete = () => {
    if (!onDeleteAccount) {
      return;
    }
    // Deleting the account does not stop store billing, so say so before the
    // user continues (App Review asks for this) and offer the way out.
    const billingNote = hasSubscription
      ? ` Your subscription is billed by ${storeName} and keeps renewing until you cancel it there, so cancel it first.`
      : '';
    Alert.alert(
      'Delete your account?',
      `This permanently removes your Vault, history, shared card links and photos. It cannot be undone.${billingNote}`,
      [
        { text: 'Keep my account', style: 'cancel' },
        ...(hasSubscription
          ? [{ text: 'Manage subscription', onPress: handleManagePlan }]
          : []),
        {
          text: 'Delete everything',
          style: 'destructive',
          onPress: () => {
            // Several server steps run here, so show Pip until it ends either way.
            setIsDeletingAccount(true);
            onDeleteAccount()
              .catch((e: unknown) => {
                Alert.alert(
                  'Could not delete',
                  e instanceof Error ? e.message : 'Please try again.',
                );
              })
              .finally(() => setIsDeletingAccount(false));
          },
        },
      ],
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

        <AccountSubscriptionCard
          tier={tier}
          onManagePlan={handleManagePlan}
          onRestorePurchases={onRestorePurchases}
          isRestoring={isRestoring}
        />

        <AccountNotificationsCard />

        <AccountPrivacyCard />
        <AccountHelpCard />
        <AccountSignOutButton onPress={onSignOut} />
        {onDeleteAccount ? <AccountDeleteButton onPress={confirmDelete} /> : null}
      </ScrollView>
      <BusyOverlay visible={isDeletingAccount} kind="deleteAccount" />
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
