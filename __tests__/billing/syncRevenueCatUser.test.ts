import Purchases from 'react-native-purchases';
import {
  configureRevenueCat,
  syncRevenueCatUser,
} from '../../src/features/billing/data/revenueCatClient';

jest.mock('react-native-purchases', () => ({
  __esModule: true,
  default: {
    configure: jest.fn(),
    logIn: jest.fn(async () => undefined),
    logOut: jest.fn(async () => undefined),
    isAnonymous: jest.fn(async () => true),
    setLogLevel: jest.fn(),
  },
  LOG_LEVEL: { DEBUG: 'DEBUG' },
  PURCHASES_ERROR_CODE: {},
}));

const purchases = Purchases as unknown as {
  logIn: jest.Mock;
  logOut: jest.Mock;
  isAnonymous: jest.Mock;
};

describe('syncRevenueCatUser for guests', () => {
  beforeAll(async () => {
    await configureRevenueCat(null);
  });

  beforeEach(() => {
    purchases.logIn.mockClear();
    purchases.logOut.mockClear();
    purchases.isAnonymous.mockReset();
  });

  it('does not log out a user who is already anonymous (it throws and blocks plans loading)', async () => {
    purchases.isAnonymous.mockResolvedValue(true);
    await expect(syncRevenueCatUser(null)).resolves.toBeUndefined();
    expect(purchases.logOut).not.toHaveBeenCalled();
  });

  it('still logs out when a signed-in user signs out', async () => {
    purchases.isAnonymous.mockResolvedValue(false);
    await syncRevenueCatUser(null);
    expect(purchases.logOut).toHaveBeenCalledTimes(1);
  });

  it('logs a signed-in user in', async () => {
    await syncRevenueCatUser('uid-1');
    expect(purchases.logIn).toHaveBeenCalledWith('uid-1');
    expect(purchases.logOut).not.toHaveBeenCalled();
  });
});
