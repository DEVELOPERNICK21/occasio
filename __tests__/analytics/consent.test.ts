import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  canCollectAnalytics,
  getAnalyticsConsent,
  loadAnalyticsConsent,
  resetAnalyticsConsent,
  setAnalyticsConsent,
  subscribeAnalyticsConsent,
} from '../../src/shared/analytics/consent';
import { registerAnalyticsSink, trackEvent } from '../../src/shared/analytics/events';

jest.mock('@react-native-async-storage/async-storage', () => {
  const store = new Map<string, string>();
  return {
    __esModule: true,
    default: {
      getItem: jest.fn(async (k: string) => store.get(k) ?? null),
      setItem: jest.fn(async (k: string, v: string) => void store.set(k, v)),
      removeItem: jest.fn(async (k: string) => void store.delete(k)),
      clear: jest.fn(async () => store.clear()),
    },
  };
});

const sink = jest.fn();
registerAnalyticsSink(sink);

beforeEach(async () => {
  jest.spyOn(console, 'log').mockImplementation(() => undefined);
  sink.mockClear();
  resetAnalyticsConsent();
  await AsyncStorage.clear();
});
afterEach(() => jest.restoreAllMocks());

describe('analytics consent', () => {
  it('starts off: nothing is collected before the person says yes', () => {
    expect(getAnalyticsConsent()).toBe('unset');
    expect(canCollectAnalytics()).toBe(false);
    trackEvent('card_shared');
    expect(sink).not.toHaveBeenCalled();
  });

  it('collects only after an explicit yes, and stops the moment it is revoked', async () => {
    await setAnalyticsConsent(true);
    trackEvent('card_shared', { moment: 'birthday' });
    expect(sink).toHaveBeenCalledWith('card_shared', { moment: 'birthday' });

    await setAnalyticsConsent(false);
    sink.mockClear();
    trackEvent('card_shared');
    expect(sink).not.toHaveBeenCalled();
  });

  it('remembers the choice across launches, including a refusal', async () => {
    await setAnalyticsConsent(true);
    resetAnalyticsConsent();
    await expect(loadAnalyticsConsent()).resolves.toBe('granted');

    await setAnalyticsConsent(false);
    resetAnalyticsConsent();
    await expect(loadAnalyticsConsent()).resolves.toBe('denied');
    expect(canCollectAnalytics()).toBe(false);
  });

  it('treats unreadable storage as "not consented"', async () => {
    (AsyncStorage.setItem as jest.Mock).mockResolvedValueOnce(undefined);
    await AsyncStorage.setItem('occasio.analytics.consent.v1', '{not json');
    await expect(loadAnalyticsConsent()).resolves.toBe('unset');
    expect(canCollectAnalytics()).toBe(false);
  });

  it('tells SDK wrappers when the choice changes', async () => {
    const seen: string[] = [];
    const off = subscribeAnalyticsConsent((v) => seen.push(v));
    await setAnalyticsConsent(true);
    await setAnalyticsConsent(false);
    off();
    await setAnalyticsConsent(true);
    expect(seen).toEqual(['granted', 'denied']);
  });
});
