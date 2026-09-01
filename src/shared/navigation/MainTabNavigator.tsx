import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AccountScreen } from '../../features/auth/ui/screens/AccountScreen';
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
  return (
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
      <Tab.Screen name="CreateTab" component={CreateNavigator} />
      <Tab.Screen name="VaultTab" component={VaultNavigator} />
      <Tab.Screen name="HistoryTab" component={HistoryNavigator} />
      <Tab.Screen name="AccountTab" component={AccountScreen} />
    </Tab.Navigator>
  );
}
