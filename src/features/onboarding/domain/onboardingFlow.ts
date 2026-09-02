import { ONBOARDING_SLIDES } from './onboardingSlides';

export function getOnboardingSlideCount(): number {
  return ONBOARDING_SLIDES.length;
}

export function isLastOnboardingSlide(index: number): boolean {
  return index >= ONBOARDING_SLIDES.length - 1;
}

export function getOnboardingStepLabel(index: number): string {
  const slide = ONBOARDING_SLIDES[index];
  return slide?.eyebrow ?? `Step ${index + 1}`;
}

export function getOnboardingProgressLabel(index: number): string {
  return `Step ${index + 1} of ${ONBOARDING_SLIDES.length}`;
}

export function getOnboardingTrustLine(index: number): string {
  return ONBOARDING_SLIDES[index]?.trustLine ?? '';
}

export function getOnboardingCtaLabel(index: number): string {
  if (isLastOnboardingSlide(index)) {
    return 'Create your first wish';
  }
  const nextSlide = ONBOARDING_SLIDES[index + 1];
  if (nextSlide?.id === 'share') {
    return 'Next: how sharing works';
  }
  if (nextSlide?.id === 'remember') {
    return 'Next: save dates (optional)';
  }
  return 'Continue';
}
