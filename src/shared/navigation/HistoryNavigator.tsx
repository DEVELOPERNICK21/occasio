import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HistoryDetailScreen } from '../../features/history/ui/screens/HistoryDetailScreen';
import { HistoryListScreen } from '../../features/history/ui/screens/HistoryListScreen';
import type { HistoryStackParamList } from './types';

const Stack = createNativeStackNavigator<HistoryStackParamList>();

export function HistoryNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HistoryList" component={HistoryListScreen} />
      <Stack.Screen name="HistoryDetail" component={HistoryDetailScreen} />
    </Stack.Navigator>
  );
}
