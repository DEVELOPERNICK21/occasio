import {
  DELETE_RETRY_MESSAGE,
  LINK_STILL_ACTIVE_NOTICE,
  deleteFailureKind,
} from '../../src/features/history/domain/deleteOutcome';

describe('deleteFailureKind', () => {
  it('tells an expired sign-in from a card this account does not own', () => {
    expect(deleteFailureKind(401)).toBe('sign_in');
    expect(deleteFailureKind(403)).toBe('not_owner');
  });

  it('treats a throttled request as one to retry later', () => {
    expect(deleteFailureKind(429)).toBe('busy');
  });

  it('blames the server, not the connection, when the server answered with an error', () => {
    expect(deleteFailureKind(500)).toBe('server');
    expect(deleteFailureKind(503)).toBe('server');
  });

  it('only blames the connection when the server never answered', () => {
    expect(deleteFailureKind(null)).toBe('network');
  });
});

describe('delete messages', () => {
  it('only asks to check the connection when it really was the connection', () => {
    expect(DELETE_RETRY_MESSAGE.network).toMatch(/connection/i);
    expect(DELETE_RETRY_MESSAGE.server).not.toMatch(/connection/i);
    expect(DELETE_RETRY_MESSAGE.sign_in).not.toMatch(/connection/i);
    expect(DELETE_RETRY_MESSAGE.busy).not.toMatch(/connection/i);
  });

  it('says plainly that the link stays on when only the History row was cleared', () => {
    expect(LINK_STILL_ACTIVE_NOTICE.body).toMatch(/link stays active/i);
    expect(LINK_STILL_ACTIVE_NOTICE.title).toMatch(/removed from history/i);
  });
});
