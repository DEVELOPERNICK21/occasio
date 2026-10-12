import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { PipFriend } from '../../src/shared/ui/PipFriend';
import { EmptyState } from '../../src/shared/ui/EmptyState';
import { GuestGateScreen } from '../../src/shared/ui/GuestGateScreen';
import { PIP_SPOTS } from '../../src/shared/mascot/pipSpots';

jest.mock('../../src/shared/platform/haptics', () => ({
  triggerTabHaptic: jest.fn(),
  triggerCardHaptic: jest.fn(),
  triggerSuccessHaptic: jest.fn(),
}));

const { triggerTabHaptic } = jest.requireMock('../../src/shared/platform/haptics') as {
  triggerTabHaptic: jest.Mock;
};

function render(element: React.ReactElement): TestRenderer.ReactTestRenderer {
  let renderer: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(element);
  });
  return renderer!;
}

const text = (renderer: TestRenderer.ReactTestRenderer) => JSON.stringify(renderer.toJSON());

function tapPip(renderer: TestRenderer.ReactTestRenderer) {
  const pip = renderer.root.find(
    (node) => node.props.accessibilityLabel === 'Pip' && typeof node.props.onPress === 'function',
  );
  act(() => pip.props.onPress());
}

describe('PipFriend (hero)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    triggerTabHaptic.mockClear();
  });
  afterEach(() => jest.useRealTimers());

  it('is quiet until he is tapped, and is a labelled button', () => {
    const renderer = render(<PipFriend spot="vaultEmpty" />);

    expect(text(renderer)).not.toContain(PIP_SPOTS.vaultEmpty.lines[0]);
    expect(
      renderer.root.findAll((n) => n.props.accessibilityRole === 'button' && n.props.accessibilityLabel === 'Pip'),
    ).not.toHaveLength(0);
  });

  it('says the first line and gives a small buzz when tapped', () => {
    const renderer = render(<PipFriend spot="vaultEmpty" />);

    tapPip(renderer);

    expect(text(renderer)).toContain(PIP_SPOTS.vaultEmpty.lines[0]);
    expect(triggerTabHaptic).toHaveBeenCalledTimes(1);
  });

  it('says the next line on each tap, then goes quiet again by himself', () => {
    const renderer = render(<PipFriend spot="vaultEmpty" />);

    tapPip(renderer);
    tapPip(renderer);
    expect(text(renderer)).toContain(PIP_SPOTS.vaultEmpty.lines[1]);
    expect(text(renderer)).not.toContain(PIP_SPOTS.vaultEmpty.lines[0]);

    act(() => {
      jest.advanceTimersByTime(4000);
    });
    expect(text(renderer)).not.toContain(PIP_SPOTS.vaultEmpty.lines[1]);
  });

  it('smiles for a moment after a tap, then goes back to how he looked', () => {
    const renderer = render(<PipFriend spot="loadError" />);
    const label = () => JSON.stringify(renderer.root.findAllByProps({ accessibilityRole: 'image' }).map((n) => n.props.accessibilityLabel));

    expect(label()).toContain('shocked');
    tapPip(renderer);
    expect(label()).toContain(PIP_SPOTS.loadError.tapMood);

    act(() => {
      jest.advanceTimersByTime(1500);
    });
    expect(label()).toContain('shocked');
  });
});

describe('PipFriend (inline)', () => {
  it('has something to say straight away, and cycles when tapped', () => {
    jest.useFakeTimers();
    const renderer = render(<PipFriend spot="shareReady" variant="inline" name="Maya" />);

    expect(text(renderer)).toContain('It is ready. Send it to Maya.');
    tapPip(renderer);
    expect(text(renderer)).toContain('The link opens in any browser.');
    jest.useRealTimers();
  });
});

describe('Pip in shared screens', () => {
  it('EmptyState shows Pip instead of an icon when given a mascot', () => {
    const output = text(
      render(<EmptyState mascot="vaultEmpty" title="Nothing yet" body="Why" actionLabel="Do it" onAction={() => undefined} />),
    );

    expect(output).toContain('Pip looking hopeful');
    expect(output).toContain('Do it');
  });

  it('GuestGateScreen shows Pip too, with one sign-in action', () => {
    const output = text(
      render(
        <GuestGateScreen
          title="Vault"
          mascot="vaultGate"
          headline="Keep everyone close."
          benefits={['One thing']}
          onSignIn={() => undefined}
        />,
      ),
    );

    expect(output).toContain('Pip looking wink');
    expect(output.match(/Sign in or create account/g)).toHaveLength(1);
  });
});
