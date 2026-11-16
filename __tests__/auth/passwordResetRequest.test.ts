const mockFetchSignInMethods = jest.fn();
const mockSendReset = jest.fn();

jest.mock('@react-native-firebase/auth', () => ({
  __esModule: true,
  default: () => ({
    fetchSignInMethodsForEmail: mockFetchSignInMethods,
    sendPasswordResetEmail: mockSendReset,
  }),
}));
jest.mock('@invertase/react-native-apple-authentication', () => ({ appleAuth: {} }));
jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: { configure: jest.fn() },
  statusCodes: {},
}));
jest.mock('../../src/shared/api/httpClient', () => ({ httpClient: jest.fn() }));

import { AuthError } from '../../src/features/auth/data/authErrors';
import { sendPasswordResetEmail } from '../../src/features/auth/data/authRepository';
import {
  PASSWORD_RESET_FAILED_COPY,
  PASSWORD_RESET_SENT_COPY,
} from '../../src/features/auth/domain/passwordReset';

const firebaseError = (code: string) => Object.assign(new Error(code), { code });

beforeEach(() => {
  mockFetchSignInMethods.mockReset().mockResolvedValue(['password']);
  mockSendReset.mockReset().mockResolvedValue(undefined);
});

describe('asking for a password reset', () => {
  it('asks Firebase to email a reset link for a password account', async () => {
    await expect(sendPasswordResetEmail('maya@example.com')).resolves.toBeUndefined();
    expect(mockSendReset).toHaveBeenCalledWith('maya@example.com');
  });

  it('still asks when Firebase will not say which sign-ins an email has (enumeration protection on)', async () => {
    // With protection on the list is always empty. A Google or Apple account then gets "sent" and no
    // email, which the success copy has to explain.
    mockFetchSignInMethods.mockResolvedValue([]);
    await expect(sendPasswordResetEmail('maya@example.com')).resolves.toBeUndefined();
    expect(mockSendReset).toHaveBeenCalledTimes(1);
  });

  it('tells a Google account there is no password, instead of sending nothing', async () => {
    mockFetchSignInMethods.mockResolvedValue(['google.com']);
    await expect(sendPasswordResetEmail('maya@gmail.com')).rejects.toMatchObject({
      code: 'PASSWORD_RESET_UNAVAILABLE',
      message: expect.stringContaining('Google'),
    });
    expect(mockSendReset).not.toHaveBeenCalled();
  });

  it('tells an Apple account the same', async () => {
    mockFetchSignInMethods.mockResolvedValue(['apple.com']);
    await expect(sendPasswordResetEmail('maya@icloud.com')).rejects.toMatchObject({
      code: 'PASSWORD_RESET_UNAVAILABLE',
      message: expect.stringContaining('Apple'),
    });
  });

  it('does not reveal that an email has no account', async () => {
    mockSendReset.mockRejectedValue(firebaseError('auth/user-not-found'));
    await expect(sendPasswordResetEmail('nobody@example.com')).resolves.toBeUndefined();
  });

  it('says to wait when Firebase is throttling', async () => {
    mockSendReset.mockRejectedValue(firebaseError('auth/too-many-requests'));
    await expect(sendPasswordResetEmail('maya@example.com')).rejects.toMatchObject({
      code: 'TOO_MANY_REQUESTS',
    });
  });

  it('says the connection is the problem when it is', async () => {
    mockSendReset.mockRejectedValue(firebaseError('auth/network-request-failed'));
    await expect(sendPasswordResetEmail('maya@example.com')).rejects.toMatchObject({ code: 'NETWORK' });
  });

  it('does not call a failed reset a failed sign-in', async () => {
    mockSendReset.mockRejectedValue(firebaseError('auth/internal-error'));
    const error = await sendPasswordResetEmail('maya@example.com').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(AuthError);
    expect((error as AuthError).message).toBe(PASSWORD_RESET_FAILED_COPY);
    expect((error as AuthError).message).not.toMatch(/sign-in/i);
  });
});

describe('what the person is told after asking', () => {
  it('covers the two ways nothing arrives: spam, and an account with no password', () => {
    expect(PASSWORD_RESET_SENT_COPY).toMatch(/spam/i);
    expect(PASSWORD_RESET_SENT_COPY).toMatch(/Google or Apple/);
    expect(PASSWORD_RESET_SENT_COPY).toMatch(/no password/i);
  });

  it('keeps to the calm voice, and never confirms an account exists', () => {
    for (const copy of [PASSWORD_RESET_SENT_COPY, PASSWORD_RESET_FAILED_COPY]) {
      expect(copy).not.toContain('!');
      expect(copy).not.toMatch(/\p{Extended_Pictographic}/u);
    }
    expect(PASSWORD_RESET_SENT_COPY).toMatch(/^If this email has a password account/);
  });
});
