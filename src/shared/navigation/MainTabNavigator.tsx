import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { PlaceholderTabScreen } from '../ui/PlaceholderTabScreen';
import { CreateNavigator } from './CreateNavigator';
import { lockedTabBarLabel } from './tabBarLabel';
import type { MainTabParamList } from './types';
import { colors, typography } from '../theme/tokens';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarAllowFontScaling: false,
        tabBarLabel: lockedTabBarLabel,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: {
          fontSize: typography.sizeXs,
        },
      }}
    >
      <Tab.Screen
        name="CreateTab"
        component={CreateNavigator}
        options={{ title: 'Create' }}
      />
      <Tab.Screen
        name="VaultTab"
        children={() => (
          <PlaceholderTabScreen
            title="Vault"
            message="Save people and enable auto-send."
          />
        )}
      />
      <Tab.Screen
        name="HistoryTab"
        children={() => (
          <PlaceholderTabScreen
            title="History"
            message="Past creations and reshares."
          />
        )}
      />
      <Tab.Screen
        name="AccountTab"
        children={() => (
          <PlaceholderTabScreen
            title="Account"
            message="Sign-in, plans, privacy."
          />
        )}
      />
    </Tab.Navigator>
  );
}
