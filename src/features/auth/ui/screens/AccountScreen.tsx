import { useLayoutEffect } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { FLOATING_TAB_BAR_HEIGHT } from '../../../../shared/navigation/tabBarConstants';
import type { MainTabParamList } from '../../../../shared/navigation/types';
import { SessionBootSkeleton } from '../../../../shared/ui/SkeletonLayouts';
import { useAuth } from '../../application/useAuth';
import { useSubscription } from '../../../billing/application/useSubscription';
import { AccountHomeScreen } from './AccountHomeScreen';
import { LoginScreen } from './LoginScreen';

export function AccountScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const { user, isSignedIn, isLoading, signOutUser } = useAuth();
  const {
    tier,
    hasPro,
    restore,
    isPurchasing,
    isConfigured,
    presentPaywall,
    openCustomerCenter,
    error: billingError,
  } = useSubscription();
  const immersiveAuth = isLoading || !isSignedIn;

  useLayoutEffect(() => {
    navigation.setOptions({
      tabBarStyle: immersiveAuth ? { display: 'none' } : undefined,
      sceneStyle: { paddingBottom: immersiveAuth ? 0 : FLOATING_TAB_BAR_HEIGHT },
    });
  }, [navigation, immersiveAuth]);

  if (isLoading) {
    return <SessionBootSkeleton />;
  }

  if (!isSignedIn || !user) {
    return (
      <LoginScreen
        onDismiss={() => {
          navigation.navigate('CreateTab', { screen: 'CreateHome' });
        }}
      />
    );
  }

  const handleManagePlan = () => {
    if (!isConfigured) {
      Alert.alert(
        'Billing unavailable',
        'Configure RevenueCat products (monthly, yearly, lifetime) and rebuild.',
      );
      return;
    }

    if (hasPro) {
      void openCustomerCenter().then(() => {
        if (billingError) {
          Alert.alert('Could not open', billingError);
        }
      });
      return;
    }

    void presentPaywall({ force: true });
  };

  return (
    <AccountHomeScreen
      user={user}
      tier={tier}
      hasPro={hasPro}
      isRestoring={isPurchasing}
      onManagePlan={handleManagePlan}
      onRestorePurchases={() => {
        void restore().then((ok) => {
          if (!ok) {
            Alert.alert(
              'No purchases found',
              billingError ?? 'Nothing to restore on this store account.',
            );
          }
        });
      }}
      onSignOut={() => {
        void signOutUser();
      }}
    />
  );
}









