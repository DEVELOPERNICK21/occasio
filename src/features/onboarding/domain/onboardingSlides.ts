export type OnboardingSlideId = 'create' | 'share' | 'remember';

export type OnboardingSlide = {
  id: OnboardingSlideId;
  title: string;
  body: string;
};

/** First-run copy — single source of truth for onboarding content. */
export const ONBOARDING_SLIDES: readonly OnboardingSlide[] = [
  {
    id: 'create',
    title: 'Make a wish card in minutes',
    body: 'Choose an occasion, add a photo, and write a short message.',
  },
  {
    id: 'share',
    title: 'Share a private link',
    body: 'They open a beautiful page. No app download required.',
  },
  {
    id: 'remember',
    title: 'Save people for next year',
    body: 'Sign in later to keep birthdays and anniversaries in your vault.',
  },
] as const;
