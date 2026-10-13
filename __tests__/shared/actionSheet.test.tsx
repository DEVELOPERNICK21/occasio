import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { Camera, Images } from 'lucide-react-native';
import { ActionSheet, SHEET_ACTION_DELAY_MS } from '../../src/shared/ui/ActionSheet';

jest.mock('../../src/shared/platform/haptics', () => ({
  triggerTabHaptic: jest.fn(),
  triggerCardHaptic: jest.fn(),
  triggerSuccessHaptic: jest.fn(),
}));

async function render(element: React.ReactElement): Promise<TestRenderer.ReactTestRenderer> {
  let renderer: TestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = TestRenderer.create(element);
  });
  return renderer!;
}

const text = (renderer: TestRenderer.ReactTestRenderer) => JSON.stringify(renderer.toJSON());
const press = (renderer: TestRenderer.ReactTestRenderer, label: RegExp) =>
  renderer.root.find(
    (node) => typeof node.props.onPress === 'function' && label.test(String(node.props.accessibilityLabel)),
  );

describe('ActionSheet', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  const actions = (onLibrary = jest.fn(), onCamera = jest.fn()) => [
    { id: 'library', label: 'Photo library', description: 'Choose several at once', icon: Images, onPress: onLibrary },
    { id: 'camera', label: 'Take a photo', icon: Camera, onPress: onCamera },
  ];

  it('shows nothing while closed', async () => {
    const renderer = await render(<ActionSheet visible={false} title="Add photos" actions={actions()} onClose={jest.fn()} />);
    expect(renderer.toJSON()).toBeNull();
  });

  it('shows its title, message, header and every choice when open', async () => {
    const renderer = await render(
      <ActionSheet
        visible
        title="Add photos"
        message="Up to 5 more"
        header={<></>}
        actions={actions()}
        onClose={jest.fn()}
      />,
    );
    const out = text(renderer);
    expect(out).toContain('Add photos');
    expect(out).toContain('Up to 5 more');
    expect(out).toContain('Photo library');
    expect(out).toContain('Choose several at once');
    expect(out).toContain('Take a photo');
  });

  it('closes first and runs the chosen action once the sheet is gone', async () => {
    const onClose = jest.fn();
    const onLibrary = jest.fn();
    const renderer = await render(<ActionSheet visible title="Add photos" actions={actions(onLibrary)} onClose={onClose} />);

    await act(async () => press(renderer, /^Photo library/).props.onPress());
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenLastCalledWith('action');
    expect(onLibrary).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(SHEET_ACTION_DELAY_MS + 5);
    });
    expect(onLibrary).toHaveBeenCalledTimes(1);
  });

  it('can be dismissed by Cancel, the scrim and the phone back button, without running anything', async () => {
    const onClose = jest.fn();
    const onLibrary = jest.fn();
    const renderer = await render(<ActionSheet visible title="Add photos" actions={actions(onLibrary)} onClose={onClose} />);

    await act(async () => press(renderer, /^Cancel$/).props.onPress());
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenLastCalledWith('dismiss');

    await act(async () => renderer.root.findByProps({ transparent: true }).props.onRequestClose());
    expect(onClose).toHaveBeenCalledTimes(2);
    expect(onClose).toHaveBeenLastCalledWith('dismiss');

    await act(async () => {
      jest.advanceTimersByTime(SHEET_ACTION_DELAY_MS + 5);
    });
    expect(onLibrary).not.toHaveBeenCalled();
  });

  it('marks a dangerous choice so it can be told apart', async () => {
    const renderer = await render(
      <ActionSheet
        visible
        title="Maya"
        actions={[{ id: 'delete', label: 'Delete', tone: 'danger', onPress: jest.fn() }]}
        onClose={jest.fn()}
      />,
    );
    expect(text(renderer)).toContain('Delete');
  });
});
