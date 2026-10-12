import {
  DELETE_SUPPORT_EMAIL,
  deleteAccountFailureMessage,
} from '../../src/features/auth/domain/deleteAccountError';

describe('deleteAccountFailureMessage', () => {
  it('blames the connection only when the server was never reached', () => {
    expect(deleteAccountFailureMessage(new TypeError('Network request failed'))).toMatch(
      /connection/i,
    );
  });

  it('owns a server fault, says nothing was removed, and gives a way to finish', () => {
    const message = deleteAccountFailureMessage({ status: 500 });

    expect(message).toMatch(/our side/i);
    expect(message).toMatch(/nothing was removed/i);
    expect(message).toContain(DELETE_SUPPORT_EMAIL);
    expect(message).not.toMatch(/connection/i);
  });

  it('tells an expired sign-in to sign in again', () => {
    expect(deleteAccountFailureMessage({ status: 401 })).toMatch(/sign in again/i);
    expect(deleteAccountFailureMessage({ status: 403 })).toMatch(/sign in again/i);
  });

  it('asks the person to wait when they are throttled', () => {
    expect(deleteAccountFailureMessage({ status: 429 })).toMatch(/wait/i);
  });

  it('treats an unavailable server like any other server fault', () => {
    expect(deleteAccountFailureMessage({ status: 503 })).toContain(DELETE_SUPPORT_EMAIL);
  });
});
