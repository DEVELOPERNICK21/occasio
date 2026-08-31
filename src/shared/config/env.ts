import { Platform } from 'react-native';
import { firebaseConfig } from '../firebase/config';

const FUNCTIONS_EMULATOR_PORT = 5001;

/** Android emulator reaches host machine via 10.0.2.2 */
function functionsEmulatorHost(): string {
  return Platform.OS === 'android' ? '10.0.2.2' : '127.0.0.1';
}

function productionApiBase(): string {
  return `https://${firebaseConfig.region}-${firebaseConfig.projectId}.cloudfunctions.net/api`;
}

function emulatorApiBase(): string {
  const host = functionsEmulatorHost();
  return `http://${host}:${FUNCTIONS_EMULATOR_PORT}/${firebaseConfig.projectId}/${firebaseConfig.region}/api`;
}

export const env = {
  firebaseProjectId: firebaseConfig.projectId,

  /** Public recipient pages (docs-site /c/[slug]). */
  shareBaseUrl: 'https://occasio-greetings.vercel.app',

  /**
   * When true, create/upload skip network and return mocks.
   * Set true only for offline UI work — default uses real Firebase (Spark).
   */
  useMockApi: false,

  /**
   * Spark without Blaze: embed one compressed photo as base64 in Firestore.
   * Set false after upgrading to Blaze and enabling Firebase Storage.
   */
  useBase64Media: true,

  /**
   * Local Functions emulator only (no Blaze required on your machine).
   * Run: npm run functions:serve — then set true and useMockApi false.
   */
  useFunctionsEmulator: false,
} as const;

export function getApiBaseUrl(): string {
  if (env.useFunctionsEmulator) {
    return emulatorApiBase();
  }
  return productionApiBase();
}
