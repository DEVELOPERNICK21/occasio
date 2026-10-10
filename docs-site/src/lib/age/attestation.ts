import { createHmac, timingSafeEqual } from 'node:crypto';
import { MINIMUM_AGE } from './ageGate';

/**
 * A signed "this device passed the 13+ check" token. It deliberately carries no
 * birthday and no identity, so there is nothing personal to leak or to store.
 * The server hands one out after validating a date of birth; the app keeps it and
 * presents it when an account is created so the server can stamp that account.
 */
const VERSION = 1;
export const ATTESTATION_MAX_AGE_MS = 180 * 24 * 60 * 60 * 1000;
const CLOCK_SKEW_MS = 5 * 60 * 1000;

type Payload = { v: number; min: number; iat: number };

function b64(value: Buffer | string): string {
  return Buffer.from(value).toString('base64url');
}

function sign(payload: string, secret: string): Buffer {
  return createHmac('sha256', secret).update(payload).digest();
}

export function createAttestation(secret: string, now: Date = new Date()): string {
  const payload = b64(
    JSON.stringify({
      v: VERSION,
      min: MINIMUM_AGE,
      iat: Math.floor(now.getTime() / 1000),
    } satisfies Payload),
  );
  return `${payload}.${b64(sign(payload, secret))}`;
}

export function verifyAttestation(
  token: unknown,
  secret: string,
  now: Date = new Date(),
): boolean {
  if (typeof token !== 'string' || token.length > 512) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payload, signature] = parts as [string, string];

  const expected = sign(payload, secret);
  let given: Buffer;
  try {
    given = Buffer.from(signature, 'base64url');
  } catch {
    return false;
  }
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
    return false;
  }

  let data: Payload;
  try {
    data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as Payload;
  } catch {
    return false;
  }
  if (data.v !== VERSION || typeof data.iat !== 'number' || data.min < MINIMUM_AGE) {
    return false;
  }
  const issuedMs = data.iat * 1000;
  return (
    issuedMs <= now.getTime() + CLOCK_SKEW_MS &&
    now.getTime() - issuedMs <= ATTESTATION_MAX_AGE_MS
  );
}

/** Secret from the environment; short secrets are rejected so a typo cannot weaken the signature. */
export function attestationSecret(): string | null {
  const secret = process.env.AGE_ATTESTATION_SECRET;
  return secret && secret.length >= 32 ? secret : null;
}
