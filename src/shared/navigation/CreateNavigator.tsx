import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CreateDraftProvider } from '../../features/create/application/CreateDraftContext';
import { CreateHomeScreen } from '../../features/create/ui/screens/CreateHomeScreen';
import { AddPhotosScreen } from '../../features/create/ui/screens/AddPhotosScreen';
import { DetailsScreen } from '../../features/create/ui/screens/DetailsScreen';
import { PreviewScreen } from '../../features/create/ui/screens/PreviewScreen';
import { ShareSuccessScreen } from '../../features/create/ui/screens/ShareSuccessScreen';
import { TemplatePickerScreen } from '../../features/create/ui/screens/TemplatePickerScreen';
import type { CreateStackParamList } from './types';

const Stack = createNativeStackNavigator<CreateStackParamList>();

export function CreateNavigator() {
  return (
    <CreateDraftProvider>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="CreateHome" component={CreateHomeScreen} />
        <Stack.Screen name="TemplatePicker" component={TemplatePickerScreen} />
        <Stack.Screen name="AddPhotos" component={AddPhotosScreen} />
        <Stack.Screen name="Details" component={DetailsScreen} />
        <Stack.Screen name="Preview" component={PreviewScreen} />
        <Stack.Screen name="ShareSuccess" component={ShareSuccessScreen} />
      </Stack.Navigator>
    </CreateDraftProvider>
  );
}
