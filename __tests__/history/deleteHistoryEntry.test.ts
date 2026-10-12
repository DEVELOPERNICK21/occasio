const mockGet = jest.fn();
const mockDelete = jest.fn(async () => undefined);
const mockHttpDelete = jest.fn();

jest.mock('@react-native-firebase/auth', () => ({
  __esModule: true,
  default: () => ({
    currentUser: { uid: 'u1', getIdToken: async () => 'token-1' },
  }),
}));

jest.mock('@react-native-firebase/firestore', () => ({
  __esModule: true,
  default: Object.assign(
    () => ({
      collection: () => ({ doc: () => ({ get: mockGet, delete: mockDelete }) }),
    }),
    { FieldValue: {}, Timestamp: {} },
  ),
}));

jest.mock('../../src/shared/api/httpClient', () => ({
  httpClient: { delete: (...args: unknown[]) => mockHttpDelete(...args) },
}));

import { HttpError } from '../../src/shared/api/errors';
import { deleteHistoryEntry } from '../../src/features/history/data/historyRepository';
import {
  DELETE_RETRY_MESSAGE,
} from '../../src/features/history/domain/deleteOutcome';

const ownRow = { exists: true, data: () => ({ userId: 'u1' }) };

describe('deleteHistoryEntry', () => {
  beforeEach(() => {
    mockGet.mockReset().mockResolvedValue(ownRow);
    mockDelete.mockClear();
    mockHttpDelete.mockReset().mockResolvedValue(undefined);
  });

  it('turns the link off through the server, which clears the row too', async () => {
    await expect(deleteHistoryEntry('c1')).resolves.toEqual({ linkTurnedOff: true });

    expect(mockHttpDelete).toHaveBeenCalledTimes(1);
    expect(mockHttpDelete.mock.calls[0]?.[2]).toEqual({ Authorization: 'Bearer token-1' });
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it('clears the leftover row when the card is already gone', async () => {
    mockHttpDelete.mockRejectedValue(new HttpError('NOT_FOUND', 'gone', 404));
    await expect(deleteHistoryEntry('c1')).resolves.toEqual({ linkTurnedOff: true });
    expect(mockDelete).toHaveBeenCalledTimes(1);

    mockDelete.mockClear();
    mockHttpDelete.mockRejectedValue(new HttpError('EXPIRED', 'expired', 410));
    await expect(deleteHistoryEntry('c1')).resolves.toEqual({ linkTurnedOff: true });
    expect(mockDelete).toHaveBeenCalledTimes(1);
  });

  it('never leaves History stuck when the server says this account does not own the link', async () => {
    mockHttpDelete.mockRejectedValue(new HttpError('UNAUTHORIZED', 'Not allowed to delete this card.', 403));

    await expect(deleteHistoryEntry('c1')).resolves.toEqual({ linkTurnedOff: false });

    expect(mockDelete).toHaveBeenCalledTimes(1);
  });

  it('keeps the row and blames the right thing when a retry could still work', async () => {
    mockHttpDelete.mockRejectedValue(new HttpError('INTERNAL', 'boom', 500));
    await expect(deleteHistoryEntry('c1')).rejects.toMatchObject({
      code: 'NETWORK',
      message: DELETE_RETRY_MESSAGE.server,
    });

    mockHttpDelete.mockRejectedValue(new HttpError('UNAUTHORIZED', 'expired token', 401));
    await expect(deleteHistoryEntry('c1')).rejects.toMatchObject({
      code: 'NOT_AUTHENTICATED',
      message: DELETE_RETRY_MESSAGE.sign_in,
    });

    mockHttpDelete.mockRejectedValue(new TypeError('Network request failed'));
    await expect(deleteHistoryEntry('c1')).rejects.toMatchObject({
      code: 'NETWORK',
      message: DELETE_RETRY_MESSAGE.network,
    });

    expect(mockDelete).not.toHaveBeenCalled();
  });

  it('refuses to touch a row that belongs to someone else', async () => {
    mockGet.mockResolvedValue({ exists: true, data: () => ({ userId: 'someone-else' }) });

    await expect(deleteHistoryEntry('c1')).rejects.toMatchObject({ code: 'UNKNOWN' });

    expect(mockHttpDelete).not.toHaveBeenCalled();
    expect(mockDelete).not.toHaveBeenCalled();
  });
});
