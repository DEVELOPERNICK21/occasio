import { NavigationContainer } from '@react-navigation/native';
import { MainTabNavigator } from './MainTabNavigator';

export function AppNavigator() {
  return (
    <NavigationContainer>
      <MainTabNavigator />
    </NavigationContainer>
  );
}
