/**
 * Runtime config. Override when Firebase Functions are deployed.
 * See `.env.example` and docs-site/content/env-strategy.md
 *
 * Future: wire via react-native-config from .env.development
 */
const DEV_API_BASE = 'https://asia-south1-occasio-dev.cloudfunctions.net';

export const env = {
  /** Dev builds use mock API until Functions exist. Set false when backend is live. */
  useMockApi: __DEV__,
  apiBaseUrl: DEV_API_BASE,
  shareBaseUrl: 'https://occasio.vercel.app',
} as const;
