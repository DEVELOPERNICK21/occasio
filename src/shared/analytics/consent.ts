import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Analytics consent: opt-in, stored on the device, revocable at any time.
 *
 * Nothing is collected until the person says yes, and "not asked yet" counts as
 * no. `trackEvent` checks this before handing an event to ANY sink, so adding a
 * new analytics or crash SDK later cannot start collecting by accident: it must
 * be registered through `registerAnalyticsSink`, which only ever receives events
 * while consent is granted.
 *
 * Session replay, screen recording, heatmaps and keystroke capture are not used
 * and must not be added behind this switch. If one is ever needed it needs its
 * own, separate, explicit consent and input masking on every text field.
 */
const KEY = 'occasio.analytics.consent.v1';

export type AnalyticsConsent = 'unset' | 'granted' | 'denied';

let current: AnalyticsConsent = 'unset';
const listeners = new Set<(value: AnalyticsConsent) => void>();

export function getAnalyticsConsent(): AnalyticsConsent {
  return current;
}

/** Only an explicit yes counts. */
export function canCollectAnalytics(): boolean {
  return current === 'granted';
}

export async function loadAnalyticsConsent(): Promise<AnalyticsConsent> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as { granted?: unknown }) : null;
    current = parsed?.granted === true ? 'granted' : parsed?.granted === false ? 'denied' : 'unset';
  } catch {
    current = 'unset';
  }
  return current;
}

export async function setAnalyticsConsent(granted: boolean): Promise<void> {
  current = granted ? 'granted' : 'denied';
  listeners.forEach((listener) => listener(current));
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify({ granted, at: new Date().toISOString() }));
  } catch {
    // The choice still applies for this session; it will be asked again next time.
  }
}

/** For SDK wrappers that must switch collection on/off the moment the choice changes. */
export function subscribeAnalyticsConsent(listener: (value: AnalyticsConsent) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Test helper. */
export function resetAnalyticsConsent(): void {
  current = 'unset';
  listeners.clear();
}
