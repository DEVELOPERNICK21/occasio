import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useOnboarding } from '../../features/onboarding/application/useOnboarding';
import { OnboardingScreen } from '../../features/onboarding/ui/screens/OnboardingScreen';
import { AppBootSkeleton } from '../ui/SkeletonLayouts';
import { MainTabNavigator } from './MainTabNavigator';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  const { status, completeOnboarding } = useOnboarding();

  if (status === 'loading') {
    return <AppBootSkeleton />;
  }

  return (
    <NavigationContainer>
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

