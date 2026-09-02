import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AddPersonScreen } from '../../features/vault/ui/screens/AddPersonScreen';
import { PersonDetailScreen } from '../../features/vault/ui/screens/PersonDetailScreen';
import { VaultListScreen } from '../../features/vault/ui/screens/VaultListScreen';
import type { VaultStackParamList } from './types';

const Stack = createNativeStackNavigator<VaultStackParamList>();

export function VaultNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="VaultList" component={VaultListScreen} />
      <Stack.Screen name="AddPerson" component={AddPersonScreen} />
      <Stack.Screen name="PersonDetail" component={PersonDetailScreen} />
    </Stack.Navigator>
  );
}
