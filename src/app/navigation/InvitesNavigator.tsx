import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AddPhotosScreen } from '../../features/create/ui/screens/AddPhotosScreen';
import { InviteDesignScreen } from '../../features/create/ui/screens/InviteDesignScreen';
import { InviteDetailsScreen } from '../../features/create/ui/screens/InviteDetailsScreen';
import { InviteHomeScreen } from '../../features/create/ui/screens/InviteHomeScreen';
import { InvitePlanScreen } from '../../features/create/ui/screens/InvitePlanScreen';
import { InviteReplyScreen } from '../../features/create/ui/screens/InviteReplyScreen';
import { PreviewScreen } from '../../features/create/ui/screens/PreviewScreen';
import { ShareSuccessScreen } from '../../features/create/ui/screens/ShareSuccessScreen';
import type { InviteStackParamList } from '../../shared/navigation/types';

const Stack = createNativeStackNavigator<InviteStackParamList>();

/**
 * The Invitations tab: its own steps first, then the photo, review and share screens that cards use,
 * so an invitation is paid for, uploaded and shared by exactly the same code.
 */
export function InvitesNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="InviteHome" component={InviteHomeScreen} />
      <Stack.Screen name="InviteDesign" component={InviteDesignScreen} />
      <Stack.Screen name="InviteDetails" component={InviteDetailsScreen} />
      <Stack.Screen name="InvitePlan" component={InvitePlanScreen} />
      <Stack.Screen name="InviteReply" component={InviteReplyScreen} />
      <Stack.Screen name="AddPhotos" component={AddPhotosScreen} />
      <Stack.Screen name="Preview" component={PreviewScreen} />
      <Stack.Screen name="ShareSuccess" component={ShareSuccessScreen} />
    </Stack.Navigator>
  );
}
