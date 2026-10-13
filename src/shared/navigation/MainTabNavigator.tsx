import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useMemo } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { CreateDraftProvider } from '../../features/create/application/CreateDraftContext';
import { useAuth } from '../../features/auth/application/useAuth';
import { AccountScreen } from '../../features/auth/ui/screens/AccountScreen';
import { useVaultPeople } from '../../features/vault/application/useVaultPeople';
import { countComingUp } from '../../features/vault/domain/vaultOccasion';
import { OnboardingHandoff } from '../../features/onboarding/ui/components/OnboardingHandoff';
import { WidgetHost } from '../../features/widgets/ui/WidgetHost';
import { CreateNavigator } from './CreateNavigator';
import { HistoryNavigator } from './HistoryNavigator';
import { VaultNavigator } from './VaultNavigator';
import { FLOATING_TAB_BAR_HEIGHT } from './tabBarConstants';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

function renderFloatingTabBar(props: BottomTabBarProps) {
  const { FloatingTabBar } = require('./FloatingTabBar') as typeof import('./FloatingTabBar');
  return <FloatingTabBar {...props} />;
}

export function MainTabNavigator() {
  const { isSignedIn } = useAuth();
  const { people } = useVaultPeople(isSignedIn);
  // A small badge on Vault while someone's day is within the week.
  const comingUp = useMemo(() => countComingUp(people), [people]);

  return (
    <CreateDraftProvider>
      <WidgetHost />
      <OnboardingHandoff />
      <Tab.Navigator
        tabBar={renderFloatingTabBar}
        screenOptions={{
          headerShown: false,
          tabBarHideOnKeyboard: true,
          sceneStyle: {
            paddingBottom: FLOATING_TAB_BAR_HEIGHT,
          },
        }}
      >
        <Tab.Screen
          name="CreateTab"
          component={CreateNavigator}
          listeners={({ navigation }) => ({
            tabPress: () => {
              const tabsState = navigation.getState();
              const createRoute = tabsState.routes.find((r) => r.name === 'CreateTab');
              const stackIndex =
                createRoute?.state && 'index' in createRoute.state
                  ? (createRoute.state.index ?? 0)
                  : 0;
              if (stackIndex > 0) {
                navigation.navigate('CreateTab', { screen: 'CreateHome' });
              }
            },
          })}
        />
        <Tab.Screen
          name="VaultTab"
          component={VaultNavigator}
          options={{ tabBarBadge: comingUp > 0 ? comingUp : undefined }}
        />
        <Tab.Screen name="HistoryTab" component={HistoryNavigator} />
        <Tab.Screen name="AccountTab" component={AccountScreen} />
      </Tab.Navigator>
    </CreateDraftProvider>
  );
}
