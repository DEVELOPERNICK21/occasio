import { useEffect } from 'react';
import { Alert, Linking } from 'react-native';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { MainTabParamList } from '../../../../shared/navigation/types';
import { appPlatform } from '../../../../shared/platform/runtime';
import { useAuth } from '../../../auth/application/useAuth';
import { useSubscription } from '../../../billing/application/useSubscription';
import { useWishBalance } from '../../../billing/application/useWishBalance';
import { describeBillingNotice, plansUnavailableNotice } from '../../../billing/domain/billingNotice';
import { subscriptionsUrl } from '../../../billing/domain/renewalTerms';
import { AccountHomeScreen } from './AccountHomeScreen';

/** The signed-in account. Who gets this screen, and what a guest sees instead, is the app shell's call (`AccountTab`). */
export function AccountScreen() {
  const { user, signOutUser, deleteAccountUser } = useAuth();
  const {
    tier,
    hasPro,
    restore,
    isPurchasing,
    isConfigured,
    presentPaywall,
    openCustomerCenter,
    clearError,
  } = useSubscription();
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const isFocused = useIsFocused();
  const { balance, refresh: refreshBalance } = useWishBalance(user?.uid ?? null);

  // A card made or a purchase since the last visit changes what is left.
  useEffect(() => {
    if (isFocused) void refreshBalance();
  }, [isFocused, refreshBalance]);

  if (!user) {
    return null;
  }

  const handleManagePlan = () => {
    if (!isConfigured) {
      const unavailable = describeBillingNotice('NOT_CONFIGURED', { platform: appPlatform() });
      Alert.alert(unavailable.title, unavailable.message);
      return;
    }

    if (hasPro) {
      void openCustomerCenter().then((opened) => {
        if (!opened) {
          // The in-app screen could not open: send them straight to the store's
          // own cancel page so cancelling is never blocked.
          void Linking.openURL(subscriptionsUrl(appPlatform()));
        }
      });
      return;
    }

    void presentPaywall({ force: true }).then((result) => {
      if (result === 'error') {
        const failed = plansUnavailableNotice(appPlatform());
        Alert.alert(failed.title, failed.message);
        clearError();
      }
    });
  };

  return (
    <AccountHomeScreen
      user={user}
      tier={tier}
      hasPro={hasPro}
      balance={balance}
      onOpenBadges={() => navigation.navigate('CreateTab', { screen: 'Badges' })}
      isRestoring={isPurchasing}
      onManagePlan={handleManagePlan}
      onRestorePurchases={() => {
        void restore().then(({ restored, notice }) => {
          if (!restored && notice) {
            Alert.alert(notice.title, notice.message);
          }
          // Shown once here; it must not turn up again on another screen.
          clearError();
        });
      }}
      onSignOut={() => {
        void signOutUser();
      }}
      onDeleteAccount={deleteAccountUser}
    />
  );
}











