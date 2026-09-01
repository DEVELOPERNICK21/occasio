/**
 * Occasio — React Native app entry
 * @format
 */

import { useEffect } from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import '@react-native-firebase/app';
import { lockToPortrait } from 'react-native-orientation-turbo';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/features/auth/application/AuthProvider';
import { SoftAuthModal } from './src/features/auth/ui/components/SoftAuthModal';
import { AppNavigator } from './src/shared/navigation/AppNavigator';
import {
  getFirebaseProjectId,
  isFirebaseConfigured,
} from './src/shared/firebase/app';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  useEffect(() => {
    lockToPortrait();
    if (__DEV__) {
      const projectId = getFirebaseProjectId();
      console.log(
        `[Occasio] Firebase ${isFirebaseConfigured() ? 'ready' : 'misconfigured'} — project: ${projectId ?? 'none'}`,
      );
    }
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AuthProvider>
        <AppNavigator />
        <SoftAuthModal />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

export default App;
