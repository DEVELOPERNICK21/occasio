import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { CreateProblemSheet } from '../../src/features/create/ui/components/CreateProblemSheet';
import { SHEET_ACTION_DELAY_MS } from '../../src/shared/ui/ActionSheet';

jest.mock('../../src/shared/platform/haptics', () => ({
  triggerTabHaptic: jest.fn(),
  triggerCardHaptic: jest.fn(),
  triggerSuccessHaptic: jest.fn(),
}));

describe('CreateProblemSheet', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  async function render(message: string | null) {
    const props = { message, onRetry: jest.fn(), onClose: jest.fn() };
    let renderer!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(<CreateProblemSheet {...props} />);
    });
    return { renderer, props };
  }
  const text = (r: TestRenderer.ReactTestRenderer) => JSON.stringify(r.toJSON());

  it('says what went wrong in the sheet, with Pip, not as a line under the button', async () => {
    const { renderer } = await render('Sharing is unavailable right now. Please try again in a little while.');
    expect(text(renderer)).toContain('That did not go through');
    expect(text(renderer)).toContain('Sharing is unavailable right now');
  });

  it('shows nothing while nothing has gone wrong', async () => {
    const { renderer } = await render(null);
    expect(renderer.toJSON()).toBeNull();
  });

  it('closes, then makes the link again, when asked to try again', async () => {
    const { renderer, props } = await render('Could not create share link');
    const retry = renderer.root.find(
      (n) => typeof n.props.onPress === 'function' && /Try again/.test(String(n.props.accessibilityLabel)),
    );
    await act(async () => {
      retry.props.onPress();
    });
    expect(props.onClose).toHaveBeenCalledWith('action');
    expect(props.onRetry).not.toHaveBeenCalled();
    await act(async () => {
      jest.advanceTimersByTime(SHEET_ACTION_DELAY_MS + 50);
    });
    expect(props.onRetry).toHaveBeenCalledTimes(1);
  });
});
