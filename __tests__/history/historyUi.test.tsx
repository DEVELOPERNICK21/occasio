import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { Send } from 'lucide-react-native';

jest.mock('../../src/shared/platform/haptics', () => ({
  triggerTabHaptic: jest.fn(),
  triggerCardHaptic: jest.fn(),
  triggerSuccessHaptic: jest.fn(),
}));

import { EmptyState } from '../../src/shared/ui/EmptyState';
import { GuestGateScreen } from '../../src/shared/ui/GuestGateScreen';
import { HistorySummaryCard } from '../../src/features/history/ui/components/HistorySummaryCard';
import { HistoryWishCard } from '../../src/features/history/ui/components/HistoryWishCard';
import { getTemplateTheme } from '../../src/features/create/domain/templateTheme';
import type { HistoryEntry } from '../../src/features/history/domain/types';

function render(element: React.ReactElement): TestRenderer.ReactTestRenderer {
  let renderer: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(element);
  });
  return renderer!;
}

function textOf(renderer: TestRenderer.ReactTestRenderer): string {
  return JSON.stringify(renderer.toJSON());
}

const entry: HistoryEntry = {
  id: 'h1',
  creationId: 'c1',
  recipientName: 'Maya Rao',
  templateType: 'birthday',
  message: 'Happy birthday, Maya',
  shareUrl: 'https://occasio.example/w/abc',
  createdAt: '2026-10-01T10:00:00.000Z',
  expiresAt: '2026-10-31T10:00:00.000Z',
} as HistoryEntry;

const noop = () => undefined;

describe('HistoryWishCard', () => {
  it('offers share and copy while the link is active', () => {
    const output = textOf(
      render(
        <HistoryWishCard
          entry={entry}
          theme={getTemplateTheme('birthday')}
          statusHeadline="Active for 12 more days"
          expired={false}
          onPress={noop}
          onShare={noop}
          onCopy={() => true}
          onCreateNew={noop}
          onMenu={noop}
        />,
      ),
    );

    expect(output).toContain('Share again');
    expect(output).toContain('Copy link');
    expect(output).toContain('Active for 12 more days');
    expect(output).not.toContain('Make a new card');
  });

  it('swaps dead buttons for a clear next step once the link has expired', () => {
    const output = textOf(
      render(
        <HistoryWishCard
          entry={entry}
          theme={getTemplateTheme('birthday')}
          statusHeadline="Link expired"
          expired
          onPress={noop}
          onShare={noop}
          onCopy={() => true}
          onCreateNew={noop}
          onMenu={noop}
        />,
      ),
    );

    expect(output).toContain('Make a new card');
    expect(output).not.toContain('Share again');
    expect(output).not.toContain('Copy link');
  });

  it('confirms a copy and ignores a failed one', () => {
    let copyResult = true;
    const renderer = render(
      <HistoryWishCard
        entry={entry}
        theme={getTemplateTheme('birthday')}
        statusHeadline="Active for 12 more days"
        expired={false}
        onPress={noop}
        onShare={noop}
        onCopy={() => copyResult}
        onCreateNew={noop}
        onMenu={noop}
      />,
    );

    jest.useFakeTimers();
    const copyButton = () =>
      renderer.root.find(
        (node) =>
          typeof node.props.onPress === 'function' &&
          (node.props.accessibilityLabel === 'Copy link' ||
            node.props.accessibilityLabel === 'Link copied') &&
          typeof node.type !== 'string',
      );

    copyResult = false;
    act(() => {
      copyButton().props.onPress();
    });
    expect(textOf(renderer)).not.toContain('Copied');

    copyResult = true;
    act(() => {
      copyButton().props.onPress();
    });
    expect(textOf(renderer)).toContain('Copied');

    act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(textOf(renderer)).toContain('Copy link');
    jest.useRealTimers();
  });
});

describe('HistorySummaryCard', () => {
  it('shows the three counts without marketing copy', () => {
    const output = textOf(render(<HistorySummaryCard summary={{ total: 9, active: 4, thisMonth: 2 }} />));

    expect(output).toContain('This month');
    expect(output).toContain('Active links');
    expect(output).toContain('All time');
    expect(output).not.toContain('LEGACY');
  });
});

describe('EmptyState', () => {
  it('renders one action when given one, and none otherwise', () => {
    const withAction = textOf(
      render(
        <EmptyState icon={Send} title="Nothing here" body="Why" actionLabel="Do it" onAction={noop} />,
      ),
    );
    const without = textOf(render(<EmptyState icon={Send} title="Nothing here" body="Why" />));

    expect(withAction).toContain('Do it');
    expect(without).not.toContain('Do it');
  });

  it('puts Pip in the icon slot when given a mascot spot', () => {
    const output = textOf(
      render(<EmptyState mascot="historyEmpty" title="Nothing here" body="Why" />),
    );

    expect(output).toContain('Tap to hear what Pip has to say');
    expect(output).toContain('Nothing here');
  });
});

describe('GuestGateScreen', () => {
  it('lists what signing in unlocks with a single sign-in action', () => {
    const renderer = render(
      <GuestGateScreen
        title="Vault"
        icon={Send}
        headline="Keep everyone close."
        benefits={['One thing', 'Another thing']}
        onSignIn={noop}
      />,
    );
    const output = textOf(renderer);

    expect(output).toContain('One thing');
    expect(output).toContain('Another thing');
    expect(output).toContain('Sign in or create account');
    expect(output.toLowerCase()).not.toContain('coming in the next');
    expect(output.match(/Sign in or create account/g)).toHaveLength(1);
  });

  it('shows Pip instead of an icon when given a mascot spot', () => {
    const output = textOf(
      render(
        <GuestGateScreen
          title="Vault"
          mascot="vaultGate"
          headline="Keep everyone close."
          benefits={['One thing']}
          onSignIn={noop}
        />,
      ),
    );

    expect(output).toContain('Tap to hear what Pip has to say');
    expect(output.match(/Sign in or create account/g)).toHaveLength(1);
  });
});
