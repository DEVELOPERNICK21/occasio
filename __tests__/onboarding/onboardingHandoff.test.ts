import {
  setPendingOnboardingIntent,
  takePendingOnboardingIntent,
} from '../../src/features/onboarding/application/onboardingHandoff';

describe('onboarding handoff', () => {
  afterEach(() => setPendingOnboardingIntent(null));

  it('hands the answers over exactly once', () => {
    setPendingOnboardingIntent({ audience: 'mom', occasion: 'birthday' });
    expect(takePendingOnboardingIntent()).toEqual({ audience: 'mom', occasion: 'birthday' });
    expect(takePendingOnboardingIntent()).toBeNull();
  });

  it('is empty when onboarding was skipped', () => {
    setPendingOnboardingIntent(null);
    expect(takePendingOnboardingIntent()).toBeNull();
  });
});
