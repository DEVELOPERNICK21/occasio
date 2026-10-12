import {
  deleteUnsentReports,
  getCrashlytics,
  log,
  setCrashlyticsCollectionEnabled,
  setUserId,
} from '@react-native-firebase/crashlytics';
import { canCollectAnalytics, subscribeAnalyticsConsent } from '../analytics/consent';
import { registerAnalyticsSink } from '../analytics/events';
import { isFirebaseConfigured } from './app';

let started = false;
let currentUid: string | null = null;

/**
 * Crash reports leave the device only from release builds, and only while the
 * person has opted in (`consent.ts`). Saying no also drops reports still queued.
 * Call after `loadAnalyticsConsent()` so the stored choice is applied first.
 */
export function startCrashReporting(): void {
  if (started || !isFirebaseConfigured()) return;
  started = true;
  const crashlytics = getCrashlytics();

  const apply = () => {
    const enabled = !__DEV__ && canCollectAnalytics();
    void setCrashlyticsCollectionEnabled(crashlytics, enabled);
    if (!enabled) void deleteUnsentReports(crashlytics);
  };
  apply();
  subscribeAnalyticsConsent(apply);

  // Event names only; `trackEvent` payloads never carry personal content.
  registerAnalyticsSink((name) => log(crashlytics, name));
  void setUserId(crashlytics, currentUid ?? '');
}

/** Account id only (no email or name), so a crash can be matched to a support request. */
export function setCrashReportUser(uid: string | null): void {
  currentUid = uid;
  if (!started) return;
  void setUserId(getCrashlytics(), uid ?? '');
}
