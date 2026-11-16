import {
  memberSinceLabel,
  profileBio,
  profileInitials,
  subscriptionAmountLabel,
  subscriptionPaymentLabel,
  subscriptionStatusCopy,
  tierDisplayLabel,
} from '../../src/features/account/domain/accountProfile';
import type { AuthUser } from '../../src/features/auth/domain/types';

const user = (over: Partial<AuthUser> = {}): AuthUser => ({
  uid: 'u1',
  email: null,
  phoneNumber: null,
  displayName: null,
  createdAt: null,
  ...over,
});

describe('the profile header', () => {
  it('takes initials from the name, then the email, and never comes out empty', () => {
    expect(profileInitials(user({ displayName: 'Priya Sharma' }))).toBe('PS');
    expect(profileInitials(user({ displayName: 'Priya' }))).toBe('PR');
    expect(profileInitials(user({ email: 'maya@example.com' }))).toBe('MA');
    // Nothing to go on: the sign-in label is used rather than an empty circle.
    expect(profileInitials(user())).toBe('SI');
    expect(profileInitials(user({ displayName: '   ' }))).not.toBe('');
  });

  it('says since when the account has existed, or nothing false when it is unknown', () => {
    expect(memberSinceLabel('2026-03-04T10:00:00.000Z')).toBe('Member since 2026');
    expect(memberSinceLabel(null)).toBe('Member since you joined');
    expect(memberSinceLabel('not a date')).toBe('Member since you joined');
  });

  it('has a calm one-line bio', () => {
    expect(profileBio(user())).not.toContain('!');
  });
});

describe('the plan on the profile', () => {
  it('names each plan and what it includes', () => {
    expect(tierDisplayLabel('free')).toBe('FREE TIER');
    expect(tierDisplayLabel('personal')).toBe('OCCASIO PRO');
    expect(tierDisplayLabel('family')).toBe('FAMILY TIER');
    expect(subscriptionAmountLabel('free')).toBe('Free');
    expect(subscriptionAmountLabel('personal')).toBe('Occasio Pro');
    expect(subscriptionStatusCopy('personal')).toContain('24 cards a year');
    expect(subscriptionStatusCopy('family')).toContain('15 people');
    expect(subscriptionStatusCopy('free')).toContain('first card is free');
  });

  it('only says billed when there is a plan to bill', () => {
    expect(subscriptionPaymentLabel('free')).toBe('Not billed');
    expect(subscriptionPaymentLabel('personal')).toBe('Active via store');
    expect(subscriptionPaymentLabel('family')).toBe('Active via store');
  });
});
