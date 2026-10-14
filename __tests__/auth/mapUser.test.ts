import { mapFirebaseUser } from '../../src/features/auth/domain/mapUser';

const base = { uid: 'u1', email: 'a@b.com', phoneNumber: null, displayName: null };

describe('mapFirebaseUser: which sign-ins can claim the free card', () => {
  it('counts Google and Apple', () => {
    expect(mapFirebaseUser({ ...base, providerIds: ['google.com'] }).viaGoogleOrApple).toBe(true);
    expect(mapFirebaseUser({ ...base, providerIds: ['apple.com'] }).viaGoogleOrApple).toBe(true);
  });

  it('does not count an email and password, however it was confirmed', () => {
    expect(mapFirebaseUser({ ...base, providerIds: ['password'] }).viaGoogleOrApple).toBe(false);
  });

  it('counts an email account that also has Google linked', () => {
    expect(
      mapFirebaseUser({ ...base, providerIds: ['password', 'google.com'] }).viaGoogleOrApple,
    ).toBe(true);
  });

  it('is false when nothing is known', () => {
    expect(mapFirebaseUser(base).viaGoogleOrApple).toBe(false);
  });
});
