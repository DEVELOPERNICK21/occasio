import { env } from '../../../shared/config/env';

/** True when using Firestore directly (Spark — no Cloud Functions). */
export function useSparkBackend(): boolean {
  return !env.useMockApi && !env.useFunctionsEmulator;
}
