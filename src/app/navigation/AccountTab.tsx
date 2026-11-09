import { useLayoutEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { AccountScreen } from '../../features/account/ui/screens/AccountScreen';
import { useAuth } from '../../features/auth/application/useAuth';
import { LoginScreen } from '../../features/auth/ui/screens/LoginScreen';
import { FLOATING_TAB_BAR_HEIGHT } from '../../shared/navigation/tabBarConstants';
import type { MainTabParamList } from '../../shared/navigation/types';
import { SessionBootSkeleton } from '../../shared/ui/SkeletonLayouts';

/**
 * The account tab: a skeleton while the session loads, the login screen (full screen, no tab bar)
 * for a guest, and the account for someone signed in. It lives in the app shell because it
 * chooses between two features, and neither should know about the other.
 */
export function AccountTab() {
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const { user, isSignedIn, isLoading } = useAuth();
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

  return <AccountScreen />;
}
