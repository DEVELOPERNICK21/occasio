import {
  emailFieldError,
  passwordFieldError,
  passwordStrength,
  PASSWORD_RULES,
} from '../../src/features/auth/domain/email';

describe('emailFieldError', () => {
  it('asks for an email when there is none, and for a fix when it looks wrong', () => {
    expect(emailFieldError('')).toBe('Enter your email address.');
    expect(emailFieldError('   ')).toBe('Enter your email address.');
    expect(emailFieldError('maya@')).toMatch(/Check the email/);
    expect(emailFieldError('maya@example')).toMatch(/Check the email/);
  });

  it('accepts a normal address whatever the case or spaces', () => {
    expect(emailFieldError('  Maya@Example.COM ')).toBeNull();
  });
});

describe('passwordFieldError', () => {
  it('asks for a password when there is none', () => {
    expect(passwordFieldError('', 'sign_in')).toBe('Enter your password.');
    expect(passwordFieldError('', 'sign_up')).toBe('Enter your password.');
  });

  it('holds a new password to the minimum but lets an older, shorter one sign in', () => {
    expect(passwordFieldError('short', 'sign_up')).toBe('Use at least 8 characters.');
    expect(passwordFieldError('short', 'sign_in')).toBeNull();
    expect(passwordFieldError('longenough', 'sign_up')).toBeNull();
  });
});

describe('password checklist and strength', () => {
  it('ticks the length rule only once there are enough characters', () => {
    const length = PASSWORD_RULES.find((rule) => rule.id === 'length')!;
    expect(length.met('1234567')).toBe(false);
    expect(length.met('12345678')).toBe(true);
  });

  it('calls an empty box empty and a short password weak', () => {
    expect(passwordStrength('')).toBe('empty');
    expect(passwordStrength('abc')).toBe('weak');
    expect(passwordStrength('Abc1!xy')).toBe('weak');
  });

  it('rewards length and a mix of characters', () => {
    expect(passwordStrength('abcdefgh')).toBe('weak');
    expect(passwordStrength('abcdefghij')).toBe('good');
    expect(passwordStrength('Abcdefg1')).toBe('good');
    expect(passwordStrength('Abcdefghij12!')).toBe('strong');
  });
});
