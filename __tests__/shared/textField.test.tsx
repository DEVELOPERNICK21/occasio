import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { Mail } from 'lucide-react-native';
import { TextField } from '../../src/shared/ui/TextField';

async function render(element: React.ReactElement): Promise<TestRenderer.ReactTestRenderer> {
  let renderer: TestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = TestRenderer.create(element);
  });
  return renderer!;
}

const text = (renderer: TestRenderer.ReactTestRenderer) => JSON.stringify(renderer.toJSON());
const input = (renderer: TestRenderer.ReactTestRenderer) =>
  renderer.root.find((node) => node.props.accessibilityLabel === 'Email' && 'secureTextEntry' in node.props);
const eye = (renderer: TestRenderer.ReactTestRenderer) =>
  renderer.root.find(
    (node) =>
      typeof node.props.onPress === 'function' &&
      /^(Show|Hide) password$/.test(String(node.props.accessibilityLabel)),
  );

describe('TextField', () => {
  it('shows its label and a quiet hint', async () => {
    const renderer = await render(<TextField label="Email" hint="We never share it" value="" onChangeText={() => undefined} />);
    expect(text(renderer)).toContain('Email');
    expect(text(renderer)).toContain('We never share it');
  });

  it('replaces the hint with the reason when something is wrong, and says it to screen readers', async () => {
    const renderer = await render(
      <TextField label="Email" hint="We never share it" error="Enter your email address." value="" onChangeText={() => undefined} />,
    );
    expect(text(renderer)).toContain('Enter your email address.');
    expect(text(renderer)).not.toContain('We never share it');
    expect(input(renderer).props.accessibilityHint).toBe('Enter your email address.');
    expect(
      renderer.root.findAll((node) => node.props.accessibilityLiveRegion === 'polite'),
    ).not.toHaveLength(0);
  });

  it('keeps a password hidden until the eye is pressed, then hides it again', async () => {
    const renderer = await render(
      <TextField label="Email" secret value="hunter22" onChangeText={() => undefined} />,
    );
    expect(input(renderer).props.secureTextEntry).toBe(true);
    expect(eye(renderer).props.accessibilityLabel).toBe('Show password');

    await act(async () => eye(renderer).props.onPress());
    expect(input(renderer).props.secureTextEntry).toBe(false);
    expect(eye(renderer).props.accessibilityLabel).toBe('Hide password');
    expect(eye(renderer).props.accessibilityState).toEqual({ selected: true });

    await act(async () => eye(renderer).props.onPress());
    expect(input(renderer).props.secureTextEntry).toBe(true);
  });

  it('never auto-corrects or capitalises a password, whatever the caller passes', async () => {
    const renderer = await render(
      <TextField label="Email" secret autoCapitalize="words" autoCorrect value="" onChangeText={() => undefined} />,
    );
    expect(input(renderer).props.autoCapitalize).toBe('none');
    expect(input(renderer).props.autoCorrect).toBe(false);
  });

  it('only offers the eye on passwords', async () => {
    const renderer = await render(<TextField label="Email" leftIcon={Mail} value="a" onChangeText={() => undefined} />);
    expect(renderer.root.findAll((node) => /password/i.test(String(node.props.accessibilityLabel)))).toHaveLength(0);
  });

  it('offers a clear button only while the field has text and focus', async () => {
    const onChangeText = jest.fn();
    const renderer = await render(<TextField label="Email" clearable value="maya@" onChangeText={onChangeText} />);
    const clear = () =>
      renderer.root.findAll((node) => node.props.accessibilityLabel === 'Clear email' && typeof node.props.onPress === 'function');
    expect(clear()).toHaveLength(0);

    await act(async () => input(renderer).props.onFocus({}));
    expect(clear()).not.toHaveLength(0);

    await act(async () => clear()[0].props.onPress());
    expect(onChangeText).toHaveBeenCalledWith('');
  });
});
