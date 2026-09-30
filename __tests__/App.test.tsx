/**
 * @format
 */

jest.mock('react-native-orientation-turbo', () => ({
  lockToPortrait: jest.fn(),
}));

jest.mock('@react-native-firebase/app', () => ({
  __esModule: true,
  default: {
    apps: [{ name: '[DEFAULT]' }],
    app: () => ({ options: { projectId: 'test' } }),
    initializeApp: jest.fn(),
  },
}));

jest.mock('@react-native-firebase/auth', () => {
  const auth = () => ({
    currentUser: null,
    onAuthStateChanged: (cb: (user: null) => void) => {
      cb(null);
      return jest.fn();
    },
  });
  auth.GoogleAuthProvider = { credential: jest.fn() };
  auth.AppleAuthProvider = { credential: jest.fn() };
  return { __esModule: true, default: auth };
});

jest.mock('@react-native-firebase/firestore', () => ({
  __esModule: true,
  default: Object.assign(() => ({ collection: jest.fn() }), {
    FieldValue: { serverTimestamp: jest.fn(), increment: jest.fn(), arrayUnion: jest.fn() },
    Timestamp: { fromDate: jest.fn() },
  }),
}));

jest.mock('@react-native-firebase/storage', () => ({
  __esModule: true,
  default: () => ({ ref: jest.fn() }),
}));

jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: { configure: jest.fn(), signOut: jest.fn(), hasPlayServices: jest.fn() },
  statusCodes: {},
}));

jest.mock('@invertase/react-native-apple-authentication', () => ({
  appleAuth: { isSupported: false },
}));

jest.mock('react-native-purchases', () => ({
  __esModule: true,
  default: { configure: jest.fn(), PACKAGE_TYPE: {} },
  LOG_LEVEL: {},
  PURCHASES_ERROR_CODE: {},
}));

jest.mock('react-native-purchases-ui', () => ({
  __esModule: true,
  default: {},
  PAYWALL_RESULT: {},
}));

jest.mock('react-native-sound', () => {
  const Sound = jest.fn();
  (Sound as unknown as { setCategory: unknown }).setCategory = jest.fn();
  return { __esModule: true, default: Sound };
});

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async () => null),
    setItem: jest.fn(async () => undefined),
    removeItem: jest.fn(async () => undefined),
  },
}));

jest.mock('lottie-react-native', () => 'LottieView');
jest.mock('react-native-haptic-feedback', () => ({ trigger: jest.fn() }));
jest.mock('react-native-image-crop-picker', () => ({}));
jest.mock('react-native-image-picker', () => ({}));

jest.mock('@react-native-firebase/messaging', () => {
  const messaging = () => ({
    requestPermission: jest.fn(async () => 1),
    getToken: jest.fn(async () => ''),
    onTokenRefresh: jest.fn(() => jest.fn()),
    onNotificationOpenedApp: jest.fn(() => jest.fn()),
    getInitialNotification: jest.fn(async () => null),
    setBackgroundMessageHandler: jest.fn(),
  });
  return { __esModule: true, default: messaging };
});

jest.mock('@react-navigation/native', () => {
  const React = require('react');
  return {
    NavigationContainer: React.forwardRef(
      (
        {
          children,
        }: {
          children: React.ReactNode;
        },
        _ref: unknown,
      ) => children,
    ),
    useNavigation: () => ({ navigate: jest.fn(), popToTop: jest.fn() }),
    useNavigationContainerRef: () => ({
      isReady: () => false,
      navigate: jest.fn(),
    }),
  };
});

jest.mock('@react-navigation/bottom-tabs', () => {
  const React = require('react');
  return {
    createBottomTabNavigator: () => ({
      Navigator: ({ children }: { children: React.ReactNode }) => children,
      Screen: () => null,
    }),
  };
});

jest.mock('@react-navigation/native-stack', () => {
  const React = require('react');
  return {
    createNativeStackNavigator: () => ({
      Navigator: ({ children }: { children: React.ReactNode }) => children,
      Screen: () => null,
    }),
  };
});

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});
