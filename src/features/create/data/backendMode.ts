import { env } from '../../../shared/config/env';

/** True when using Firestore directly (Spark — no Cloud Functions). */
export function isSparkBackend(): boolean {
  return !env.useMockApi && !env.useFunctionsEmulator;
}
