import { useCallback, useRef } from 'react';
import {
  DefaultTheme,
  NavigationContainer,
  useNavigationContainerRef,
  type Theme,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAgeGate } from '../../features/age/application/useAgeGate';
import { AgeBlockedScreen } from '../../features/age/ui/screens/AgeBlockedScreen';
import { AgeGateScreen } from '../../features/age/ui/screens/AgeGateScreen';
import { useOnboarding } from '../../features/onboarding/application/useOnboarding';
import {
  openAutosendNotification,
  useFcmRegistration,
  type AutosendNotificationPayload,
} from '../../features/vault/application/useFcmRegistration';
import { OnboardingScreen } from '../../features/onboarding/ui/screens/OnboardingScreen';
import { colors } from '../theme/tokens';
import { AppBootSkeleton } from '../ui/SkeletonLayouts';
import { MainTabNavigator } from './MainTabNavigator';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

/** Without this every scene (and the gap behind the floating tab bar) paints system grey. */
const navigationTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.accent,
    background: colors.bg,
    card: colors.surface,
    text: colors.ink,
    border: colors.border,
    notification: colors.accent,
  },
};

export function AppNavigator() {
  const { status, completeOnboarding } = useOnboarding();
  const age = useAgeGate();
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

  if (status === 'loading' || age.status === 'loading') {
    return <AppBootSkeleton />;
  }

  // 13+ check first: nothing is collected (no account, name, photo) before it passes.
  if (age.status === 'blocked') {
    return <AgeBlockedScreen />;
  }
  if (age.status === 'needed') {
    return <AgeGateScreen error={age.error} isChecking={age.isChecking} onSubmit={age.submit} />;
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      theme={navigationTheme}
      onReady={onNavigationReady}
    >
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

