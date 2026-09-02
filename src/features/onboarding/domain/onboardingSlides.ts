export type OnboardingSlideId = 'create' | 'share' | 'remember';

export type OnboardingSlide = {
  id: OnboardingSlideId;
  /** Step label — sets expectations (behavioral design). */
  eyebrow: string;
  title: string;
  body: string;
  /** Honest benefit line — persuasive, not inflated. */
  outcome: string;
  /** Trust cue — anti dark-pattern transparency. */
  trustLine: string;
};

/** First-run copy — single source of truth for onboarding content. */
export const ONBOARDING_SLIDES: readonly OnboardingSlide[] = [
  {
    id: 'create',
    eyebrow: 'Step 1 · Create',
    title: 'Make a wish card in minutes',
    body: 'Choose an occasion, add a photo, and write a short message. You preview everything before you share.',
    outcome: 'Most cards take under two minutes to make.',
    trustLine: 'No account needed to start.',
  },
  {
    id: 'share',
    eyebrow: 'Step 2 · Share',
    title: 'Send a private link',
    body: 'Share by text or WhatsApp. They open a calm page in their browser — no app download.',
    outcome: 'Only people with the link can view the card.',
    trustLine: 'Unlisted link · not searchable online.',
  },
  {
    id: 'remember',
    eyebrow: 'Step 3 · Optional',
    title: 'Save people for next year',
    body: 'Sign in when you want Vault and history. Creating and sharing stay free as a guest.',
    outcome: 'Vault helps you remember dates — never required to send a wish.',
    trustLine: 'No spam. No pressure to subscribe.',
  },
] as const;
