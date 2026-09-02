import { useLayoutEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { FLOATING_TAB_BAR_HEIGHT } from '../../../../shared/navigation/tabBarConstants';
import type { MainTabParamList } from '../../../../shared/navigation/types';
import { SessionBootSkeleton } from '../../../../shared/ui/SkeletonLayouts';
import { useAuth } from '../../application/useAuth';
import { AccountHomeScreen } from './AccountHomeScreen';
import { LoginScreen } from './LoginScreen';

export function AccountScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const { user, isSignedIn, isLoading, signOutUser } = useAuth();
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

  return (
    <AccountHomeScreen
      user={user}
      onSignOut={() => {
        void signOutUser();
      }}
    />
  );
}
