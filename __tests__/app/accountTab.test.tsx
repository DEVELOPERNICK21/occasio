import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

const mockUseAuth = jest.fn();
const mockSetOptions = jest.fn();
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ setOptions: mockSetOptions, navigate: mockNavigate }),
}));
jest.mock('../../src/features/auth/application/useAuth', () => ({ useAuth: () => mockUseAuth() }));
// Factories may not reference out-of-scope variables, so each builds its own tiny screen.
jest.mock('../../src/features/account/ui/screens/AccountScreen', () => {
  const { createElement } = require('react');
  const { Text } = require('react-native');
  return { AccountScreen: () => createElement(Text, null, 'account screen') };
});
jest.mock('../../src/features/auth/ui/screens/LoginScreen', () => {
  const { createElement } = require('react');
  const { Text } = require('react-native');
  return {
    LoginScreen: ({ onDismiss }: { onDismiss: () => void }) =>
      createElement(Text, { onPress: onDismiss }, 'login screen'),
  };
});
jest.mock('../../src/shared/ui/SkeletonLayouts', () => {
  const { createElement } = require('react');
  const { Text } = require('react-native');
  return { SessionBootSkeleton: () => createElement(Text, null, 'loading') };
});

import { AccountTab } from '../../src/app/navigation/AccountTab';

const render = async () => {
  let renderer!: TestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = TestRenderer.create(<AccountTab />);
  });
  return JSON.stringify(renderer.toJSON());
};

describe('AccountTab (the app shell chooses between login and account)', () => {
  beforeEach(() => {
    mockSetOptions.mockReset();
    mockNavigate.mockReset();
  });

  it('shows a skeleton and hides the tab bar while the session loads', async () => {
    mockUseAuth.mockReturnValue({ user: null, isSignedIn: false, isLoading: true });
    expect(await render()).toContain('loading');
    expect(mockSetOptions).toHaveBeenLastCalledWith(
      expect.objectContaining({ tabBarStyle: { display: 'none' } }),
    );
  });

  it('shows the login screen full-screen to a guest, and dismissing it goes back to Create', async () => {
    mockUseAuth.mockReturnValue({ user: null, isSignedIn: false, isLoading: false });
    let renderer!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(<AccountTab />);
    });
    expect(JSON.stringify(renderer.toJSON())).toContain('login screen');
    expect(mockSetOptions).toHaveBeenLastCalledWith(
      expect.objectContaining({ tabBarStyle: { display: 'none' } }),
    );

    await act(async () => {
      renderer.root.findByProps({ children: 'login screen' }).props.onPress();
    });
    expect(mockNavigate).toHaveBeenCalledWith('CreateTab', { screen: 'CreateHome' });
  });

  it('shows the account, with the tab bar, to someone signed in', async () => {
    mockUseAuth.mockReturnValue({ user: { uid: 'u1' }, isSignedIn: true, isLoading: false });
    expect(await render()).toContain('account screen');
    expect(mockSetOptions).toHaveBeenLastCalledWith(
      expect.objectContaining({ tabBarStyle: undefined }),
    );
  });
});
