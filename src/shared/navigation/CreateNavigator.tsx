import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CreateHomeScreen } from '../../features/create/ui/screens/CreateHomeScreen';
import { AddPhotosScreen } from '../../features/create/ui/screens/AddPhotosScreen';
import { DetailsScreen } from '../../features/create/ui/screens/DetailsScreen';
import { PreviewScreen } from '../../features/create/ui/screens/PreviewScreen';
import { ShareSuccessScreen } from '../../features/create/ui/screens/ShareSuccessScreen';
import { WhoForScreen } from '../../features/create/ui/screens/WhoForScreen';
import { OccasionScreen } from '../../features/create/ui/screens/OccasionScreen';
import { TemplateRecommendScreen } from '../../features/create/ui/screens/TemplateRecommendScreen';
import type { CreateStackParamList } from './types';

const Stack = createNativeStackNavigator<CreateStackParamList>();

export function CreateNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CreateHome" component={CreateHomeScreen} />
      <Stack.Screen name="WhoFor" component={WhoForScreen} />
      <Stack.Screen name="Occasion" component={OccasionScreen} />
      <Stack.Screen
        name="TemplateRecommend"
        component={TemplateRecommendScreen}
      />
      <Stack.Screen name="AddPhotos" component={AddPhotosScreen} />
      <Stack.Screen name="Details" component={DetailsScreen} />
      <Stack.Screen name="Preview" component={PreviewScreen} />
      <Stack.Screen name="ShareSuccess" component={ShareSuccessScreen} />
    </Stack.Navigator>
  );
}
