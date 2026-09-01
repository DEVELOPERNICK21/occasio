import { ONBOARDING_SLIDES } from './onboardingSlides';

export function getOnboardingSlideCount(): number {
  return ONBOARDING_SLIDES.length;
}

export function isLastOnboardingSlide(index: number): boolean {
  return index >= ONBOARDING_SLIDES.length - 1;
}

export function getOnboardingCtaLabel(index: number): string {
  return isLastOnboardingSlide(index) ? 'Create your first wish' : 'Continue';
}
