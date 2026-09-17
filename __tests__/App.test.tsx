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
