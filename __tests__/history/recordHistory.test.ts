const mockGet = jest.fn();
const mockSet = jest.fn(async () => undefined);

jest.mock('@react-native-firebase/auth', () => ({
  __esModule: true,
  default: () => ({ currentUser: { uid: 'u1' } }),
}));

jest.mock('@react-native-firebase/firestore', () => ({
  __esModule: true,
  default: Object.assign(
    () => ({
      collection: () => ({ doc: () => ({ get: mockGet, set: mockSet }) }),
    }),
    {
      FieldValue: { serverTimestamp: () => 'SERVER_TS' },
      Timestamp: { fromDate: (d: Date) => d },
    },
  ),
}));

import { recordHistoryEntry } from '../../src/features/history/data/historyRepository';

const input = {
  creationId: 'c1',
  shareSlug: 'abc',
  shareUrl: 'https://x/c/abc',
  expiresAt: '2026-12-01T00:00:00.000Z',
  recipientName: 'Mom',
  templateType: 'birthday',
  message: 'Hi',
};

describe('recordHistoryEntry', () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockSet.mockClear();
  });

  it('stamps createdAt on a brand-new entry', async () => {
    mockGet.mockResolvedValue({ exists: false });
    await recordHistoryEntry(input);
    expect(mockSet).toHaveBeenCalledTimes(1);
    const [payload] = mockSet.mock.calls[0] as unknown as [Record<string, unknown>];
    expect(payload.createdAt).toBe('SERVER_TS');
    expect(payload.updatedAt).toBeUndefined();
    expect(payload.userId).toBe('u1');
  });

  it('stamps updatedAt, not createdAt, when the entry already exists', async () => {
    mockGet.mockResolvedValue({ exists: true });
    await recordHistoryEntry(input);
    const [payload] = mockSet.mock.calls[0] as unknown as [Record<string, unknown>];
    expect(payload.updatedAt).toBe('SERVER_TS');
    expect(payload.createdAt).toBeUndefined();
  });

  it('still saves when the pre-read is refused (permission denied on a missing doc)', async () => {
    mockGet.mockRejectedValue({ code: 'firestore/permission-denied' });
    await expect(recordHistoryEntry(input)).resolves.toBeUndefined();
    expect(mockSet).toHaveBeenCalledTimes(1);
  });

  it('reports a failure when the write itself is refused', async () => {
    mockGet.mockResolvedValue({ exists: false });
    mockSet.mockRejectedValueOnce({ code: 'firestore/permission-denied' });
    await expect(recordHistoryEntry(input)).rejects.toMatchObject({ code: 'NETWORK' });
  });
});
