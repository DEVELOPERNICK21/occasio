import type { OnboardingIntent } from '../domain/onboardingFlow';

/**
 * Onboarding ends before the Create flow exists (it lives inside the tab
 * navigator), so the answers wait here for one hand-off. In memory only: a
 * relaunch starts fresh, and nothing about the person leaves the device.
 */
let pending: OnboardingIntent | null = null;

export function setPendingOnboardingIntent(intent: OnboardingIntent | null): void {
  pending = intent;
}

/** Returns the waiting intent once, then forgets it. */
export function takePendingOnboardingIntent(): OnboardingIntent | null {
  const intent = pending;
  pending = null;
  return intent;
}
