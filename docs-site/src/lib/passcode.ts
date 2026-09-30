import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

export const PASSCODE_PATTERN = /^\d{4}$/;

export function hashPasscode(code: string, salt: string): string {
  return scryptSync(code, salt, 32).toString('hex');
}

export function newPasscodeSalt(): string {
  return randomBytes(16).toString('hex');
}

export function verifyPasscode(code: string, salt: string, hash: string): boolean {
  if (!PASSCODE_PATTERN.test(code)) return false;
  const actual = Buffer.from(hashPasscode(code, salt), 'hex');
  const expected = Buffer.from(hash, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
