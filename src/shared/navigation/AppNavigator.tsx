import { useCallback, useRef } from 'react';
import {
  NavigationContainer,
  useNavigationContainerRef,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useOnboarding } from '../../features/onboarding/application/useOnboarding';
import {
  openAutosendNotification,
  useFcmRegistration,
  type AutosendNotificationPayload,
} from '../../features/vault/application/useFcmRegistration';
import { OnboardingScreen } from '../../features/onboarding/ui/screens/OnboardingScreen';
import { AppBootSkeleton } from '../ui/SkeletonLayouts';
import { MainTabNavigator } from './MainTabNavigator';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  const { status, completeOnboarding } = useOnboarding();
  const navigationRef = useNavigationContainerRef<RootStackParamList>();
  const pendingOpenRef = useRef<AutosendNotificationPayload | null>(null);

  const deliverAutosendOpen = useCallback(
    (payload: AutosendNotificationPayload) => {
      const opened = openAutosendNotification(navigationRef, payload);
      if (!opened) {
        pendingOpenRef.current = payload;
      }
    },
    [navigationRef],
  );

  useFcmRegistration(deliverAutosendOpen);

  const onNavigationReady = useCallback(() => {
    const pending = pendingOpenRef.current;
    if (!pending) {
      return;
    }
    pendingOpenRef.current = null;
    deliverAutosendOpen(pending);
  }, [deliverAutosendOpen]);

  if (status === 'loading') {
    return <AppBootSkeleton />;
  }

  return (
    <NavigationContainer ref={navigationRef} onReady={onNavigationReady}>
      <Stack.Navigator
        screenOptions={{ headerShown: false }}
        initialRouteName={status === 'pending' ? 'Onboarding' : 'MainTabs'}
      >
        <Stack.Screen name="Onboarding">
          {(props) => (
            <OnboardingScreen {...props} onComplete={completeOnboarding} />
          )}
        </Stack.Screen>
        <Stack.Screen name="MainTabs" component={MainTabNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

