import { getApp } from '@react-native-firebase/app';
import { getToken, initializeAppCheck, type AppCheck } from '@react-native-firebase/app-check';
import { env } from '../config/env';
import { isFirebaseConfigured } from './app';

/**
 * Firebase App Check: a short-lived token that tells our server this request comes from the
 * real Occasio app on a real device (App Attest on iPhone, Play Integrity on Android), not a
 * script or a modified copy. It says nothing about who the person is.
 *
 * Nothing here may ever block the app: a build without the native module, a device that cannot
 * attest, or a slow network all end as "no token", and the server decides what that means.
 */

/** A first attestation can take a moment; past this the request goes without a token. */
export const APP_CHECK_TIMEOUT_MS = 5000;

let starting: Promise<AppCheck | null> | null = null;

/**
 * Debug builds, simulators and emulators cannot attest, so they use the debug provider (its
 * token is printed in the native log and registered once in the Firebase console). Release
 * builds use the real thing.
 */
function start(): Promise<AppCheck | null> {
  if (!starting) {
    starting = (async () => {
      if (env.useMockApi || env.useMockAuth || !isFirebaseConfigured()) return null;
      try {
        return await initializeAppCheck(getApp(), {
          provider: {
            providerOptions: {
              android: { provider: __DEV__ ? 'debug' : 'playIntegrity' },
              apple: { provider: __DEV__ ? 'debug' : 'appAttestWithDeviceCheckFallback' },
            },
          },
          isTokenAutoRefreshEnabled: true,
        });
      } catch {
        // Typically a build installed before the native module existed. Try again next launch.
        return null;
      }
    })();
  }
  return starting;
}

/** Call once at launch so the first request does not wait for the first attestation. */
export function startAppCheck(): void {
  void start();
}

/** The current token, or null when there is none for any reason. Never throws, never hangs. */
export async function getAppCheckToken(): Promise<string | null> {
  const fetchToken = async (): Promise<string | null> => {
    try {
      const appCheck = await start();
      if (!appCheck) return null;
      const { token } = await getToken(appCheck);
      return token || null;
    } catch {
      return null;
    }
  };
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), APP_CHECK_TIMEOUT_MS);
  });
  try {
    return await Promise.race([fetchToken(), timeout]);
  } finally {
    clearTimeout(timer);
  }
}
