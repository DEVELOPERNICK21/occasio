import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { EmailAuthForm } from '../../src/features/auth/ui/components/EmailAuthForm';
import { Button } from '../../src/shared/ui/Button';

jest.mock('../../src/shared/platform/haptics', () => ({
  triggerTabHaptic: jest.fn(),
  triggerCardHaptic: jest.fn(),
  triggerSuccessHaptic: jest.fn(),
}));

type Overrides = Partial<React.ComponentProps<typeof EmailAuthForm>>;

async function render(overrides: Overrides = {}) {
  const props = {
    mode: 'sign_in' as const,
    email: '',
    onEmailChange: jest.fn(),
    password: '',
    onPasswordChange: jest.fn(),
    isLoading: false,
    formError: null,
    onSubmit: jest.fn(),
    onForgotPassword: jest.fn(),
    onSwitchMode: jest.fn(),
    ...overrides,
  };
  let renderer: TestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = TestRenderer.create(<EmailAuthForm {...props} />);
  });
  return { renderer: renderer!, props };
}

const text = (renderer: TestRenderer.ReactTestRenderer) => JSON.stringify(renderer.toJSON());
const button = (renderer: TestRenderer.ReactTestRenderer, label: string) =>
  renderer.root.find((node) => node.props.accessibilityLabel === label && typeof node.props.onPress === 'function');
const field = (renderer: TestRenderer.ReactTestRenderer, label: string) =>
  renderer.root.find((node) => node.props.accessibilityLabel === label && 'secureTextEntry' in node.props);

describe('EmailAuthForm', () => {
  it('has an email field, a password field with an eye, and the keyboard hints people expect', async () => {
    const { renderer } = await render();

    expect(field(renderer, 'Email').props).toMatchObject({
      keyboardType: 'email-address',
      autoCapitalize: 'none',
      autoCorrect: false,
      returnKeyType: 'next',
      textContentType: 'username',
    });
    expect(field(renderer, 'Password').props).toMatchObject({
      secureTextEntry: true,
      returnKeyType: 'go',
      autoComplete: 'current-password',
      textContentType: 'password',
    });
    expect(button(renderer, 'Show password')).toBeTruthy();
  });

  it('does not submit empty fields, and says what is missing under each', async () => {
    const { renderer, props } = await render();

    await act(async () => renderer.root.findByType(Button).props.onPress());

    expect(props.onSubmit).not.toHaveBeenCalled();
    expect(text(renderer)).toContain('Enter your email address.');
    expect(text(renderer)).toContain('Enter your password.');
  });

  it('holds a new password to the minimum before it submits', async () => {
    const { renderer, props } = await render({ mode: 'sign_up', email: 'maya@example.com', password: 'short' });

    await act(async () => renderer.root.findByType(Button).props.onPress());

    expect(props.onSubmit).not.toHaveBeenCalled();
    expect(text(renderer)).toContain('Use at least 8 characters.');
  });

  it('submits once both fields are fine', async () => {
    const { renderer, props } = await render({ email: 'maya@example.com', password: 'longenough' });

    await act(async () => renderer.root.findByType(Button).props.onPress());

    expect(props.onSubmit).toHaveBeenCalledTimes(1);
    expect(text(renderer)).not.toContain('Enter your');
  });

  it('lets an older, shorter password sign in: the server decides', async () => {
    const { renderer, props } = await render({ email: 'maya@example.com', password: 'short' });

    await act(async () => renderer.root.findByType(Button).props.onPress());

    expect(props.onSubmit).toHaveBeenCalledTimes(1);
  });

  it('on sign in offers "Forgot password?" and no password checklist', async () => {
    const { renderer, props } = await render();
    expect(text(renderer)).toContain('Forgot password?');
    expect(text(renderer)).not.toContain('At least 8 characters');

    await act(async () => button(renderer, 'Forgot password').props.onPress());
    expect(props.onForgotPassword).toHaveBeenCalledTimes(1);
  });

  it('on sign up shows what a good password needs and how strong it is, and no "Forgot"', async () => {
    const { renderer } = await render({ mode: 'sign_up', password: 'Abcdefghij12!' });

    expect(text(renderer)).not.toContain('Forgot password?');
    expect(text(renderer)).toContain('At least 8 characters');
    expect(text(renderer)).toContain('Strong');
    expect(field(renderer, 'Password').props).toMatchObject({
      autoComplete: 'new-password',
      textContentType: 'newPassword',
    });
  });

  it('shows a server error in words, and locks the fields while it works', async () => {
    const { renderer } = await render({ formError: 'Wrong password.', isLoading: true });
    expect(text(renderer)).toContain('Wrong password.');
    expect(field(renderer, 'Email').props.editable).toBe(false);
    expect(field(renderer, 'Password').props.editable).toBe(false);
  });
});
