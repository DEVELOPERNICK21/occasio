import { requiresAuth, gatedActionLabel } from '../../src/features/auth/domain/gatedActions';
import {
  isValidEmail,
  isValidPassword,
  normalizeEmail,
} from '../../src/features/auth/domain/email';
import { formatAuthIdentity } from '../../src/features/auth/domain/mapUser';
import {
  passwordResetResendLabel,
  PASSWORD_RESET_RESEND_SECONDS,
} from '../../src/features/auth/domain/passwordReset';
import {
  isValidOtpCode,
  normalizeIndiaPhone,
} from '../../src/features/auth/domain/phone';

describe('gatedActions', () => {
  it('requires auth for vault and billing gates', () => {
    expect(requiresAuth('vault_save')).toBe(true);
    expect(requiresAuth('history_sync')).toBe(true);
    expect(requiresAuth('subscription_manage')).toBe(true);
  });

  it('labels actions for soft-auth copy', () => {
    expect(gatedActionLabel('vault_save')).toContain('Vault');
  });
});

describe('email', () => {
  it('normalizes and validates email', () => {
    expect(normalizeEmail('  User@Example.COM ')).toBe('user@example.com');
    expect(isValidEmail('user@example.com')).toBe(true);
    expect(isValidEmail('not-an-email')).toBe(false);
  });

  it('validates password length', () => {
    expect(isValidPassword('12345678')).toBe(true);
    expect(isValidPassword('short')).toBe(false);
  });
});

describe('mapUser', () => {
  it('formats identity from display name, email, or phone', () => {
    expect(
      formatAuthIdentity({
        uid: '1',
        displayName: 'Nick',
        email: 'nick@example.com',
        phoneNumber: null,
        createdAt: null,
      }),
    ).toBe('Nick');

    expect(
      formatAuthIdentity({
        uid: '1',
        displayName: null,
        email: 'nick@example.com',
        phoneNumber: null,
        createdAt: null,
      }),
    ).toBe('nick@example.com');
  });
});

describe('passwordReset', () => {
  it('formats resend countdown label', () => {
    expect(passwordResetResendLabel(0)).toBe('Resend email');
    expect(passwordResetResendLabel(45)).toBe('Resend in 45s');
    expect(PASSWORD_RESET_RESEND_SECONDS).toBe(60);
  });
});

describe('phone (vault recipient contact)', () => {
  it('normalizes 10-digit India mobile to E.164', () => {
    expect(normalizeIndiaPhone('9876543210')).toBe('+919876543210');
    expect(normalizeIndiaPhone('91 98765 43210')).toBe('+919876543210');
  });

  it('rejects invalid numbers', () => {
    expect(normalizeIndiaPhone('123')).toBeNull();
    expect(normalizeIndiaPhone('')).toBeNull();
  });

  it('validates OTP format (legacy — not used for login)', () => {
    expect(isValidOtpCode('123456')).toBe(true);
    expect(isValidOtpCode('12345')).toBe(false);
  });
});
