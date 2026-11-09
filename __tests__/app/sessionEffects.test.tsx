import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

const mockUseAuth = jest.fn();
const mockSync = jest.fn();
const mockStamp = jest.fn();
jest.mock('../../src/features/auth/application/useAuth', () => ({ useAuth: () => mockUseAuth() }));
jest.mock('../../src/features/history/application/useHistory', () => ({
  syncPendingHistoryEntries: () => mockSync(),
}));
jest.mock('../../src/features/age/application/accountAge', () => ({
  ensureAccountStamped: (uid: string) => mockStamp(uid),
}));

import { SessionEffects } from '../../src/app/SessionEffects';

describe('SessionEffects', () => {
  beforeEach(() => {
    mockSync.mockReset();
    mockStamp.mockReset();
  });

  it('does nothing while nobody is signed in', async () => {
    mockUseAuth.mockReturnValue({ user: null });
    await act(async () => {
      TestRenderer.create(<SessionEffects />);
    });
    expect(mockSync).not.toHaveBeenCalled();
    expect(mockStamp).not.toHaveBeenCalled();
  });

  it('saves guest cards and stamps the account when someone signs in', async () => {
    mockUseAuth.mockReturnValue({ user: { uid: 'u1' } });
    await act(async () => {
      TestRenderer.create(<SessionEffects />);
    });
    expect(mockSync).toHaveBeenCalledTimes(1);
    expect(mockStamp).toHaveBeenCalledWith('u1');
  });

  it('runs again for the next person to sign in, not on every render', async () => {
    mockUseAuth.mockReturnValue({ user: { uid: 'u1' } });
    let renderer!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(<SessionEffects />);
    });
    await act(async () => renderer.update(<SessionEffects />));
    expect(mockSync).toHaveBeenCalledTimes(1);

    const other = { uid: 'u2' };
    mockUseAuth.mockReturnValue({ user: other });
    await act(async () => renderer.update(<SessionEffects />));
    expect(mockSync).toHaveBeenCalledTimes(2);
    expect(mockStamp).toHaveBeenLastCalledWith('u2');
  });
});
