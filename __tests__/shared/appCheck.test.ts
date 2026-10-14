/**
 * The App Check wrapper must never throw and never hang: a build without the native module,
 * a device that cannot attest and a slow network all have to end as "no token".
 */
const mockInitialize = jest.fn();
const mockGetToken = jest.fn();
let mockConfigured = true;
let mockMock = false;

jest.mock('@react-native-firebase/app', () => ({ getApp: () => ({ name: '[DEFAULT]' }) }));
jest.mock('@react-native-firebase/app-check', () => ({
  initializeAppCheck: (...args: unknown[]) => mockInitialize(...args),
  getToken: (...args: unknown[]) => mockGetToken(...args),
}));
jest.mock('../../src/shared/firebase/app', () => ({ isFirebaseConfigured: () => mockConfigured }));
jest.mock('../../src/shared/config/env', () => ({
  env: {
    get useMockApi() {
      return mockMock;
    },
    useMockAuth: false,
  },
}));

type Wrapper = typeof import('../../src/shared/firebase/appCheck');
// The global setup replaces this module for every other test; here the real one is wanted.
function load(): Wrapper {
  let wrapper!: Wrapper;
  jest.isolateModules(() => {
    wrapper = jest.requireActual('../../src/shared/firebase/appCheck');
  });
  return wrapper;
}

describe('getAppCheckToken', () => {
  beforeEach(() => {
    mockInitialize.mockReset().mockResolvedValue({ app: 'check' });
    mockGetToken.mockReset().mockResolvedValue({ token: 'jwt-token' });
    mockConfigured = true;
    mockMock = false;
  });
  afterEach(() => jest.useRealTimers());

  it('returns the token the SDK hands out', async () => {
    expect(await load().getAppCheckToken()).toBe('jwt-token');
  });

  it('starts App Check once, however many requests ask', async () => {
    const wrapper = load();
    await Promise.all([wrapper.getAppCheckToken(), wrapper.getAppCheckToken(), wrapper.getAppCheckToken()]);
    wrapper.startAppCheck();
    expect(mockInitialize).toHaveBeenCalledTimes(1);
  });

  it('uses the debug provider in a debug build, since simulators cannot attest', async () => {
    await load().getAppCheckToken();
    const options = mockInitialize.mock.calls[0][1];
    expect(options.provider.providerOptions.android.provider).toBe('debug');
    expect(options.provider.providerOptions.apple.provider).toBe('debug');
    expect(options.isTokenAutoRefreshEnabled).toBe(true);
  });

  it('uses App Attest and Play Integrity in a release build', async () => {
    const dev = (global as { __DEV__?: boolean }).__DEV__;
    (global as { __DEV__?: boolean }).__DEV__ = false;
    try {
      await load().getAppCheckToken();
    } finally {
      (global as { __DEV__?: boolean }).__DEV__ = dev;
    }
    const options = mockInitialize.mock.calls[0][1];
    expect(options.provider.providerOptions.android.provider).toBe('playIntegrity');
    expect(options.provider.providerOptions.apple.provider).toBe('appAttestWithDeviceCheckFallback');
  });

  it('is null, not an error, when the native module is missing (a build from before it existed)', async () => {
    mockInitialize.mockRejectedValue(new Error('You attempted to use a Firebase module that is not installed natively'));
    expect(await load().getAppCheckToken()).toBeNull();
  });

  it('is null when the SDK cannot produce a token', async () => {
    mockGetToken.mockRejectedValue(new Error('attestation failed'));
    expect(await load().getAppCheckToken()).toBeNull();
  });

  it('is null for an empty token', async () => {
    mockGetToken.mockResolvedValue({ token: '' });
    expect(await load().getAppCheckToken()).toBeNull();
  });

  it('is null without touching the SDK when Firebase is not set up or the API is mocked', async () => {
    mockConfigured = false;
    expect(await load().getAppCheckToken()).toBeNull();
    mockConfigured = true;
    mockMock = true;
    expect(await load().getAppCheckToken()).toBeNull();
    expect(mockInitialize).not.toHaveBeenCalled();
  });

  it('gives up after the timeout instead of holding the request', async () => {
    jest.useFakeTimers();
    mockGetToken.mockReturnValue(new Promise(() => undefined));
    const wrapper = load();
    const pending = wrapper.getAppCheckToken();
    await jest.advanceTimersByTimeAsync(wrapper.APP_CHECK_TIMEOUT_MS + 10);
    expect(await pending).toBeNull();
  });

  it('leaves no timer running once it has an answer', async () => {
    jest.useFakeTimers();
    await load().getAppCheckToken();
    expect(jest.getTimerCount()).toBe(0);
  });
});
