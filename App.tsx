/**
 * Occasio — React Native app entry
 * @format
 */

import { useEffect } from 'react';
import { StatusBar } from 'react-native';
import '@react-native-firebase/app';
import { lockToPortrait } from 'react-native-orientation-turbo';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { loadAnalyticsConsent } from './src/shared/analytics/consent';
import { AuthProvider } from './src/features/auth/application/AuthProvider';
import { BillingProvider } from './src/features/billing/application/BillingProvider';
import { SoftAuthModal } from './src/features/auth/ui/components/SoftAuthModal';
import { AppNavigator } from './src/shared/navigation/AppNavigator';
import {
  getFirebaseProjectId,
  isFirebaseConfigured,
} from './src/shared/firebase/app';
import { startAnalytics } from './src/shared/firebase/analytics';
import { startCrashReporting } from './src/shared/firebase/crashlytics';

function App() {
  useEffect(() => {
    lockToPortrait();
    void loadAnalyticsConsent().then(() => {
      startCrashReporting();
      startAnalytics();
    });
    if (__DEV__) {
      const projectId = getFirebaseProjectId();
      console.log(
        `[Occasio] Firebase ${isFirebaseConfigured() ? 'ready' : 'misconfigured'} — project: ${projectId ?? 'none'}`,
      );
    }
  }, []);

  return (
    <SafeAreaProvider>
      {/* The UI is always light (cream); light icons in system dark mode vanish into it. */}
      <StatusBar barStyle="dark-content" />
      <AuthProvider>
        <BillingProvider>
          <AppNavigator />
          <SoftAuthModal />
        </BillingProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

export default App;
