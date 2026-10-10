import { useOnboardingHandoff } from '../../application/useOnboardingHandoff';

/** Invisible. Mounted inside the create-draft provider. */
export function OnboardingHandoff() {
  useOnboardingHandoff();
  return null;
}
