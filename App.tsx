/**
 * Occasio — React Native app entry
 * @format
 */

import { useEffect } from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { lockToPortrait } from 'react-native-orientation-turbo';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/shared/navigation/AppNavigator';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  useEffect(() => {
    lockToPortrait();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AppNavigator />
    </SafeAreaProvider>
  );
}

export default App;
