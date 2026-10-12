import {
  getAnalytics,
  logEvent,
  resetAnalyticsData,
  setAnalyticsCollectionEnabled,
} from '@react-native-firebase/analytics';
import { canCollectAnalytics, subscribeAnalyticsConsent } from '../analytics/consent';
import { registerAnalyticsSink } from '../analytics/events';
import { isFirebaseConfigured } from './app';

/**
 * Only these payload keys reach Google. Anything else is dropped — notably
 * `shareSlug` (it opens a private card) and free-text `message`.
 */
const SAFE_PARAMS = new Set([
  'action',
  'audience',
  'channel',
  'count',
  'hasDate',
  'index',
  'method',
  'mode',
  'occasion',
  'planId',
  'result',
  'source',
  'step',
  'templateId',
  'tier',
]);

type EventParams = Record<string, string | number>;

function toParams(payload?: Record<string, string | number | boolean | undefined>): EventParams {
  const params: EventParams = {};
  if (!payload) return params;
  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined || !SAFE_PARAMS.has(key)) continue;
    params[key] = typeof value === 'boolean' ? String(value) : value;
  }
  return params;
}

let started = false;

/**
 * Usage events are sent only from release builds and only while the person has
 * opted in (`consent.ts`). No advertising ID is collected (see firebase.json).
 * Call after `loadAnalyticsConsent()` so the stored choice is applied first.
 */
export function startAnalytics(): void {
  if (started || !isFirebaseConfigured()) return;
  started = true;
  const analytics = getAnalytics();

  const apply = () => {
    void setAnalyticsCollectionEnabled(analytics, !__DEV__ && canCollectAnalytics());
  };
  apply();
  subscribeAnalyticsConsent((value) => {
    apply();
    if (value === 'denied') void resetAnalyticsData(analytics);
  });

  registerAnalyticsSink((name, payload) => {
    void logEvent(analytics, name, toParams(payload));
  });
}
