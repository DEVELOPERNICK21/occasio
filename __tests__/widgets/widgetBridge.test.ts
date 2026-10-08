import { NativeModules } from 'react-native';
import {
  clearWidgetSnapshot,
  writeWidgetSnapshot,
} from '../../src/features/widgets/data/widgetBridge';
import { buildWidgetSnapshot } from '../../src/features/widgets/domain/widgetSnapshot';

const snapshot = buildWidgetSnapshot([], new Date(2026, 9, 8));
const modules = NativeModules as Record<string, unknown>;

beforeEach(() => {
  jest.spyOn(console, 'warn').mockImplementation(() => undefined);
});

afterEach(() => {
  delete modules.OccasioWidgets;
  jest.restoreAllMocks();
});

describe('widget bridge', () => {
  it('is a quiet no-op when the native module is missing', async () => {
    await expect(writeWidgetSnapshot(snapshot)).resolves.toBe(false);
    await expect(clearWidgetSnapshot()).resolves.toBe(false);
  });

  it('sends the snapshot as JSON and reports success', async () => {
    const setSnapshot = jest.fn().mockResolvedValue(undefined);
    modules.OccasioWidgets = { setSnapshot, clear: jest.fn().mockResolvedValue(undefined) };
    await expect(writeWidgetSnapshot(snapshot)).resolves.toBe(true);
    expect(JSON.parse(setSnapshot.mock.calls[0][0])).toMatchObject({ v: 1, signedIn: true });
  });

  it('reports failure instead of throwing when the native side rejects', async () => {
    modules.OccasioWidgets = {
      setSnapshot: jest.fn().mockRejectedValue(new Error('no app group')),
      clear: jest.fn().mockRejectedValue(new Error('no app group')),
    };
    await expect(writeWidgetSnapshot(snapshot)).resolves.toBe(false);
    await expect(clearWidgetSnapshot()).resolves.toBe(false);
  });
});
