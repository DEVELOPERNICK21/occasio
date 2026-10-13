import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { FloatingTabBar } from '../../src/shared/navigation/FloatingTabBar';

jest.mock('../../src/shared/platform/haptics', () => ({
  triggerTabHaptic: jest.fn(),
  triggerCardHaptic: jest.fn(),
  triggerSuccessHaptic: jest.fn(),
}));

const { triggerTabHaptic } = jest.requireMock('../../src/shared/platform/haptics') as {
  triggerTabHaptic: jest.Mock;
};

const ROUTES = [
  { key: 'c', name: 'CreateTab' },
  { key: 'v', name: 'VaultTab' },
  { key: 'h', name: 'HistoryTab' },
  { key: 'a', name: 'AccountTab' },
];

function props(overrides: { index?: number; badge?: number; hidden?: boolean } = {}) {
  const { index = 0, badge, hidden = false } = overrides;
  const emit = jest.fn(() => ({ defaultPrevented: false }));
  const navigate = jest.fn();
  const descriptors = Object.fromEntries(
    ROUTES.map((route) => [
      route.key,
      {
        options: {
          ...(route.key === 'v' && badge ? { tabBarBadge: badge } : {}),
          ...(hidden && route.key === ROUTES[index].key ? { tabBarStyle: { display: 'none' } } : {}),
        },
      },
    ]),
  );
  return {
    emit,
    navigate,
    barProps: {
      state: { index, routes: ROUTES },
      descriptors,
      navigation: { emit, navigate },
    } as unknown as BottomTabBarProps,
  };
}

async function render(barProps: BottomTabBarProps): Promise<TestRenderer.ReactTestRenderer> {
  let renderer: TestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = TestRenderer.create(<FloatingTabBar {...barProps} />);
  });
  return renderer!;
}

const text = (renderer: TestRenderer.ReactTestRenderer) => JSON.stringify(renderer.toJSON());
const tabs = (renderer: TestRenderer.ReactTestRenderer) =>
  renderer.root.findAll((node) => node.props.accessibilityRole === 'tab' && typeof node.props.onPress === 'function');

describe('FloatingTabBar', () => {
  beforeEach(() => triggerTabHaptic.mockClear());

  it('shows all four tabs with their names', async () => {
    const { barProps } = props();
    const out = text(await render(barProps));
    for (const label of ['Create', 'Vault', 'History', 'Account']) expect(out).toContain(label);
  });

  it('marks the current tab as selected for screen readers', async () => {
    const { barProps } = props({ index: 2 });
    const renderer = await render(barProps);

    expect(tabs(renderer).map((tab) => tab.props.accessibilityState.selected)).toEqual([false, false, true, false]);
  });

  it('goes to another tab with a small buzz', async () => {
    const { barProps, emit, navigate } = props({ index: 0 });
    const renderer = await render(barProps);

    await act(async () => tabs(renderer)[3].props.onPress());

    expect(triggerTabHaptic).toHaveBeenCalledTimes(1);
    expect(emit).toHaveBeenCalledWith(expect.objectContaining({ type: 'tabPress', target: 'a' }));
    expect(navigate).toHaveBeenCalledWith('AccountTab', undefined);
  });

  it('lets the current tab handle its own press (scroll to top) without navigating again', async () => {
    const { barProps, emit, navigate } = props({ index: 1 });
    const renderer = await render(barProps);

    await act(async () => tabs(renderer)[1].props.onPress());

    expect(emit).toHaveBeenCalledWith(expect.objectContaining({ type: 'tabPress', target: 'v' }));
    expect(navigate).not.toHaveBeenCalled();
  });

  it('does not navigate when a listener prevents the press', async () => {
    const { barProps, emit, navigate } = props({ index: 0 });
    emit.mockReturnValueOnce({ defaultPrevented: true });
    const renderer = await render(barProps);

    await act(async () => tabs(renderer)[2].props.onPress());

    expect(navigate).not.toHaveBeenCalled();
  });

  it('shows how many people are coming up on Vault, and says it in words', async () => {
    const { barProps } = props({ badge: 3 });
    const renderer = await render(barProps);

    expect(tabs(renderer)[1].props.accessibilityLabel).toBe('Vault, 3 coming up this week');
    expect(tabs(renderer)[0].props.accessibilityLabel).toBe('Create');
    expect(text(renderer)).toContain('"3"');
  });

  it('shows nothing extra when nobody is coming up, and "9+" for a crowd', async () => {
    const none = await render(props().barProps);
    expect(tabs(none)[1].props.accessibilityLabel).toBe('Vault');

    const crowd = await render(props({ badge: 14 }).barProps);
    expect(text(crowd)).toContain('9+');
  });

  it('disappears when the screen asks for no tab bar, such as the sign-in screen', async () => {
    const renderer = await render(props({ hidden: true }).barProps);
    expect(renderer.toJSON()).toBeNull();
  });
});
