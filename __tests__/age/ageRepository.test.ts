import AsyncStorage from '@react-native-async-storage/async-storage';
import { HttpError } from '../../src/shared/api/errors';
import {
  AccountAgeError,
  checkDateOfBirth,
  enforceAgeForNewAccount,
} from '../../src/features/age/data/ageRepository';
import { readAgeState } from '../../src/features/age/data/ageStorage';
import { httpClient } from '../../src/shared/api/httpClient';

const mockSignOut = jest.fn(async () => undefined);
jest.mock('@react-native-firebase/auth', () => ({
  __esModule: true,
  default: () => ({ signOut: mockSignOut, currentUser: null }),
}));
jest.mock('@react-native-firebase/firestore', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('@react-native-async-storage/async-storage', () => {
  const store = new Map<string, string>();
  return {
    __esModule: true,
    default: {
      getItem: jest.fn(async (k: string) => store.get(k) ?? null),
      setItem: jest.fn(async (k: string, v: string) => void store.set(k, v)),
      removeItem: jest.fn(async (k: string) => void store.delete(k)),
      clear: jest.fn(async () => store.clear()),
      __store: store,
    },
  };
});
jest.mock('../../src/shared/api/httpClient', () => ({
  httpClient: { post: jest.fn() },
}));

const post = httpClient.post as jest.Mock;
const dob = { year: 2000, month: 1, day: 1 };

beforeEach(async () => {
  post.mockReset();
  mockSignOut.mockClear();
  await AsyncStorage.clear();
});

describe('checkDateOfBirth', () => {
  it('keeps only the signed token, never the birthday', async () => {
    post.mockResolvedValue({ ok: true, attestation: 'signed.token' });
    await expect(checkDateOfBirth(dob)).resolves.toBe('passed');
    expect(await readAgeState()).toMatchObject({ status: 'confirmed', attestation: 'signed.token' });
    const stored = JSON.stringify([...(AsyncStorage as unknown as { __store: Map<string, string> }).__store.values()]);
    expect(stored).not.toContain('2000');
  });

  it('blocks the device when the server says under age, and stores no token', async () => {
    post.mockRejectedValue(new HttpError('UNDER_AGE', 'no', 403));
    await expect(checkDateOfBirth(dob)).resolves.toBe('blocked');
    expect(await readAgeState()).toMatchObject({ status: 'blocked' });
  });

  it('in a release build, stores nothing and stays undecided when the network fails', async () => {
    const real = (global as { __DEV__?: boolean }).__DEV__;
    jest.resetModules();
    (global as { __DEV__?: boolean }).__DEV__ = false;
    try {
      const release = require('../../src/features/age/data/ageRepository') as typeof import('../../src/features/age/data/ageRepository');
      const storage = require('../../src/features/age/data/ageStorage') as typeof import('../../src/features/age/data/ageStorage');
      const { httpClient: releaseClient } = require('../../src/shared/api/httpClient') as typeof import('../../src/shared/api/httpClient');
      (releaseClient.post as jest.Mock).mockRejectedValue(new Error('offline'));
      await expect(release.checkDateOfBirth(dob)).resolves.toBe('offline');
      expect(await storage.readAgeState()).toEqual({ status: 'unknown' });
    } finally {
      (global as { __DEV__?: boolean }).__DEV__ = real;
    }
  });
});

describe('enforceAgeForNewAccount', () => {
  const newUser = () => ({
    getIdToken: jest.fn(async () => 'id-token'),
    delete: jest.fn(async () => undefined),
  });

  it('keeps the account when the server records the age check', async () => {
    post.mockResolvedValueOnce({ ok: true, attestation: 'signed.token' });
    await checkDateOfBirth(dob);
    post.mockResolvedValueOnce({ ok: true });
    const user = newUser();
    await expect(enforceAgeForNewAccount(user)).resolves.toBeUndefined();
    expect(user.delete).not.toHaveBeenCalled();
    expect(post).toHaveBeenLastCalledWith(
      expect.any(String),
      '/api/v1/account/age',
      { attestation: 'signed.token' },
      { Authorization: 'Bearer id-token' },
    );
  });

  it('deletes the new account when no age check was ever passed', async () => {
    const user = newUser();
    await expect(enforceAgeForNewAccount(user)).rejects.toBeInstanceOf(AccountAgeError);
    expect(user.delete).toHaveBeenCalledTimes(1);
    expect(mockSignOut).toHaveBeenCalled();
    expect(post).not.toHaveBeenCalled();
  });

  it('deletes the new account when the server refuses, and asks again next time', async () => {
    post.mockResolvedValueOnce({ ok: true, attestation: 'signed.token' });
    await checkDateOfBirth(dob);
    post.mockRejectedValueOnce(new HttpError('ATTESTATION_INVALID', 'bad', 403));
    const user = newUser();
    await expect(enforceAgeForNewAccount(user)).rejects.toMatchObject({ reason: 'attestation' });
    expect(user.delete).toHaveBeenCalledTimes(1);
    expect(await readAgeState()).toEqual({ status: 'unknown' });
  });

  it('fails closed when the server cannot be reached', async () => {
    post.mockResolvedValueOnce({ ok: true, attestation: 'signed.token' });
    await checkDateOfBirth(dob);
    post.mockRejectedValueOnce(new Error('offline'));
    const user = newUser();
    await expect(enforceAgeForNewAccount(user)).rejects.toMatchObject({ reason: 'network' });
    expect(user.delete).toHaveBeenCalledTimes(1);
  });
});

describe('debug-build fallback when the age server is missing', () => {
  const user = () => ({
    getIdToken: jest.fn(async () => 'id-token'),
    delete: jest.fn(async () => undefined),
  });

  beforeEach(() => jest.spyOn(console, 'warn').mockImplementation(() => undefined));
  afterEach(() => jest.restoreAllMocks());

  it('lets a debug build continue when the endpoint is not deployed (404) or unreachable', async () => {
    post.mockRejectedValueOnce(new HttpError('NOT_FOUND', 'nope', 404));
    await expect(checkDateOfBirth(dob)).resolves.toBe('passed');
    post.mockRejectedValueOnce(new Error('offline'));
    await AsyncStorage.clear();
    await expect(checkDateOfBirth(dob)).resolves.toBe('passed');
  });

  it('keeps the new account in that case, without asking the server to verify the debug marker', async () => {
    post.mockRejectedValueOnce(new HttpError('NOT_FOUND', 'nope', 404));
    await checkDateOfBirth(dob);
    post.mockClear();
    const u = user();
    await expect(enforceAgeForNewAccount(u)).resolves.toBeUndefined();
    expect(u.delete).not.toHaveBeenCalled();
    expect(post).not.toHaveBeenCalled();
  });

  it('never softens a real refusal: under-age still blocks', async () => {
    post.mockRejectedValueOnce(new HttpError('UNDER_AGE', 'no', 403));
    await expect(checkDateOfBirth(dob)).resolves.toBe('blocked');
  });

  it('does not exist in release builds', async () => {
    const real = (global as { __DEV__?: boolean }).__DEV__;
    jest.resetModules();
    (global as { __DEV__?: boolean }).__DEV__ = false;
    try {
      const release = require('../../src/features/age/data/ageRepository') as typeof import('../../src/features/age/data/ageRepository');
      const { HttpError: ReleaseHttpError } = require('../../src/shared/api/errors') as typeof import('../../src/shared/api/errors');
      const { httpClient: releaseClient } = require('../../src/shared/api/httpClient') as typeof import('../../src/shared/api/httpClient');
      (releaseClient.post as jest.Mock).mockRejectedValueOnce(new ReleaseHttpError('NOT_FOUND', 'nope', 404));
      await expect(release.checkDateOfBirth(dob)).resolves.toBe('offline');
    } finally {
      (global as { __DEV__?: boolean }).__DEV__ = real;
    }
  });
});
