import {
  needsEmailVerification,
  STILL_UNCONFIRMED_NOTICE,
  VERIFY_RESEND_SECONDS,
  verifyResendLabel,
} from '../../src/features/auth/domain/emailVerification';
import { mapFirebaseUser } from '../../src/features/auth/domain/mapUser';
import type { AuthUser } from '../../src/features/auth/domain/types';

const base: AuthUser = {
  uid: 'u1',
  email: 'maya@example.com',
  phoneNumber: null,
  displayName: null,
  createdAt: null,
};

describe('needsEmailVerification', () => {
  it('asks an email-and-password account to confirm its inbox', () => {
    expect(needsEmailVerification({ ...base, usesPassword: true, emailVerified: false })).toBe(true);
    expect(needsEmailVerification({ ...base, usesPassword: true })).toBe(true);
  });

  it('is satisfied once the inbox is confirmed', () => {
    expect(needsEmailVerification({ ...base, usesPassword: true, emailVerified: true })).toBe(false);
  });

  it('never asks a Google or Apple user: they were vouched for when they signed in', () => {
    expect(needsEmailVerification({ ...base, usesPassword: false, emailVerified: true })).toBe(false);
    expect(needsEmailVerification({ ...base, usesPassword: false, emailVerified: false })).toBe(false);
  });

  it('has nothing to ask a guest', () => {
    expect(needsEmailVerification(null)).toBe(false);
    expect(needsEmailVerification(undefined)).toBe(false);
  });
});

describe('mapFirebaseUser verification fields', () => {
  const firebase = { uid: 'u1', email: 'a@b.co', phoneNumber: null, displayName: null };

  it('reads confirmed state and whether a password is how they signed in', () => {
    expect(mapFirebaseUser({ ...firebase, emailVerified: true, providerIds: ['google.com'] })).toMatchObject({
      emailVerified: true,
      usesPassword: false,
    });
    expect(mapFirebaseUser({ ...firebase, emailVerified: false, providerIds: ['password'] })).toMatchObject({
      emailVerified: false,
      usesPassword: true,
    });
  });

  it('treats missing information as not confirmed, never as confirmed', () => {
    expect(mapFirebaseUser(firebase)).toMatchObject({ emailVerified: false, usesPassword: false });
  });

  it('counts an account that has both a password and Google as one that uses a password', () => {
    const both = mapFirebaseUser({ ...firebase, emailVerified: false, providerIds: ['google.com', 'password'] });
    expect(both.usesPassword).toBe(true);
  });
});

describe('resend wording', () => {
  it('counts down, then goes back to the plain label', () => {
    expect(verifyResendLabel(VERIFY_RESEND_SECONDS)).toBe('Send the link again (60s)');
    expect(verifyResendLabel(0)).toBe('Send the link again');
  });

  it('says what to do when the email is still unconfirmed, without blame', () => {
    expect(STILL_UNCONFIRMED_NOTICE).toMatch(/Open the link/);
    expect(STILL_UNCONFIRMED_NOTICE).not.toMatch(/!/);
  });
});
