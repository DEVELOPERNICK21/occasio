const mockSignOut = jest.fn(async () => undefined);
jest.mock('@react-native-firebase/auth', () => ({
  __esModule: true,
  default: () => ({ signOut: mockSignOut }),
}));

const mockEnforce = jest.fn();
jest.mock('../../src/features/age/application/accountAge', () => {
  class AccountAgeError extends Error {
    reason: string;
    constructor(reason: string) {
      super(`age_${reason}`);
      this.reason = reason;
    }
  }
  return {
    AccountAgeError,
    enforceAgeForNewAccount: (...args: unknown[]) => mockEnforce(...args),
    ensureAccountStamped: jest.fn(),
  };
});
const { AccountAgeError: MockAccountAgeError } = jest.requireMock(
  '../../src/features/age/application/accountAge',
) as { AccountAgeError: new (reason: 'under_age' | 'attestation' | 'network') => Error };

import { ageNewAccountGate, installAccountGates } from '../../src/app/accountGates';
import {
  requireNewAccountApproval,
  setNewAccountGate,
} from '../../src/features/auth/data/newAccountGate';
import { NewAccountRefusedError } from '../../src/features/auth/domain/newAccountGate';

function account() {
  return { getIdToken: jest.fn(async () => 'token'), delete: jest.fn(async () => undefined) };
}

describe('new-account gate in auth', () => {
  beforeEach(() => {
    mockSignOut.mockClear();
    setNewAccountGate(null);
  });

  it('refuses, and removes the account, when nothing is installed: a missing wire never lets an account stay', async () => {
    const user = account();
    await expect(requireNewAccountApproval(user)).rejects.toMatchObject({ reason: 'refused' });
    expect(user.delete).toHaveBeenCalledTimes(1);
    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });

  it('still refuses when removing the account itself fails', async () => {
    const user = account();
    user.delete.mockRejectedValue(new Error('offline'));
    await expect(requireNewAccountApproval(user)).rejects.toBeInstanceOf(NewAccountRefusedError);
  });

  it('lets the account stay when the gate approves it', async () => {
    const gate = jest.fn(async () => undefined);
    setNewAccountGate(gate);
    const user = account();
    await requireNewAccountApproval(user);
    expect(gate).toHaveBeenCalledWith(user);
    expect(user.delete).not.toHaveBeenCalled();
  });

  it('passes the gate\'s refusal on untouched', async () => {
    setNewAccountGate(async () => {
      throw new NewAccountRefusedError('network');
    });
    await expect(requireNewAccountApproval(account())).rejects.toMatchObject({ reason: 'network' });
  });
});

describe('the age check as the gate (app shell)', () => {
  beforeEach(() => mockEnforce.mockReset());

  it('approves an account the age check accepts', async () => {
    mockEnforce.mockResolvedValue(undefined);
    await expect(ageNewAccountGate(account())).resolves.toBeUndefined();
  });

  it('says "try again" when the check could not be reached, and refuses for every other reason', async () => {
    mockEnforce.mockRejectedValueOnce(new MockAccountAgeError('network'));
    await expect(ageNewAccountGate(account())).rejects.toMatchObject({ reason: 'network' });
    for (const reason of ['under_age', 'attestation'] as const) {
      mockEnforce.mockRejectedValueOnce(new MockAccountAgeError(reason));
      await expect(ageNewAccountGate(account())).rejects.toMatchObject({ reason: 'refused' });
    }
  });

  it('does not hide an error it does not know', async () => {
    const boom = new Error('boom');
    mockEnforce.mockRejectedValue(boom);
    await expect(ageNewAccountGate(account())).rejects.toBe(boom);
  });

  it('is what installAccountGates puts in place', async () => {
    mockEnforce.mockResolvedValue(undefined);
    installAccountGates();
    const user = account();
    await requireNewAccountApproval(user);
    expect(mockEnforce).toHaveBeenCalledWith(user);
    expect(user.delete).not.toHaveBeenCalled();
  });
});
