import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { BusyOverlay } from '../../src/shared/ui/BusyOverlay';
import { PipLoader } from '../../src/shared/ui/PipLoader';

/** Async so the loader's Reduce Motion check settles inside `act`. */
async function render(element: React.ReactElement): Promise<TestRenderer.ReactTestRenderer> {
  let renderer: TestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = TestRenderer.create(element);
  });
  return renderer!;
}

async function advance(ms: number) {
  await act(async () => {
    jest.advanceTimersByTime(ms);
  });
}

const text = (renderer: TestRenderer.ReactTestRenderer) => JSON.stringify(renderer.toJSON());

describe('PipLoader', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('is a labelled progress indicator that says what is happening', async () => {
    const renderer = await render(<PipLoader kind="creating" />);

    expect(text(renderer)).toContain('Wrapping it up.');
    expect(
      renderer.root.findAll(
        (node) =>
          node.props.accessibilityRole === 'progressbar' &&
          node.props.accessibilityLabel === 'Wrapping it up.',
      ),
    ).not.toHaveLength(0);
  });

  it('changes its line the longer the wait goes on', async () => {
    const renderer = await render(<PipLoader kind="creating" />);

    await advance(4000);
    expect(text(renderer)).toContain('Making a private link.');

    await advance(20_000);
    expect(text(renderer)).toContain('Still working');
  });

  it('stops its clock once the last line is up', async () => {
    const renderer = await render(<PipLoader kind="working" />);
    const before = jest.getTimerCount();

    await advance(30_000);

    expect(text(renderer)).toContain('Still working.');
    expect(jest.getTimerCount()).toBeLessThan(before);
  });

  it('clears its own timers when it goes away, and nothing fires after', async () => {
    const errors = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const renderer = await render(<PipLoader kind="deleteCard" />);
    const running = jest.getTimerCount();

    await act(async () => renderer.unmount());
    // Its clock and Pip's blinks are gone (a couple of React/SVG internals remain).
    expect(jest.getTimerCount()).toBeLessThan(running - 2);

    await advance(60_000);
    expect(errors).not.toHaveBeenCalled();
    errors.mockRestore();
  });

  it('keeps Pip from carrying a gift when something is being removed', async () => {
    const calm = await render(<PipLoader kind="deleteAccount" holdsGift />);
    const playful = await render(<PipLoader kind="creating" holdsGift />);

    const giftOf = (renderer: TestRenderer.ReactTestRenderer) =>
      renderer.root.findAll((node) => node.props.holdsGift === true && node.props.mood === 'hopeful');

    expect(giftOf(calm)).toHaveLength(0);
    expect(giftOf(playful)).not.toHaveLength(0);
  });
});

describe('BusyOverlay', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('shows nothing when idle', async () => {
    const renderer = await render(<BusyOverlay visible={false} kind="deleteCard" />);
    expect(renderer.toJSON()).toBeNull();
  });

  it('waits a beat before it appears, so quick work never flashes a dialog', async () => {
    const renderer = await render(<BusyOverlay visible kind="deleteCard" />);
    expect(renderer.toJSON()).toBeNull();

    await advance(260);
    expect(text(renderer)).toContain('Turning off the link.');
  });

  it('never appears when the work ends inside that beat', async () => {
    const renderer = await render(<BusyOverlay visible kind="deleteCard" />);

    await advance(100);
    await act(async () => renderer.update(<BusyOverlay visible={false} kind="deleteCard" />));
    await advance(500);

    expect(renderer.toJSON()).toBeNull();
  });

  it('goes away as soon as the work ends, and starts its line again next time', async () => {
    const renderer = await render(<BusyOverlay visible kind="deleteCard" />);
    await advance(260);
    await advance(3000);
    expect(text(renderer)).toContain('Taking it out of History.');

    await act(async () => renderer.update(<BusyOverlay visible={false} kind="deleteCard" />));
    expect(renderer.toJSON()).toBeNull();

    await act(async () => renderer.update(<BusyOverlay visible kind="deleteCard" />));
    await advance(260);
    expect(text(renderer)).toContain('Turning off the link.');
  });

  it('cannot be dismissed with the back button while work runs', async () => {
    const renderer = await render(<BusyOverlay visible kind="deleteAccount" />);
    await advance(260);

    const modal = renderer.root.findByProps({ transparent: true });
    expect(() => modal.props.onRequestClose()).not.toThrow();
    expect(text(renderer)).toContain('Removing your cards and Vault.');
  });
});
