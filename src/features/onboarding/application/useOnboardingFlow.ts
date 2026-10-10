import { useCallback, useEffect, useRef, useState } from 'react';
import { AnalyticsEvents, trackEvent } from '../../../shared/analytics/events';
import type { Audience, Occasion } from '../../create/domain/templateSchema';
import {
  canContinue,
  daysUntilDate,
  defaultOccasionFor,
  EMPTY_ONBOARDING_ANSWERS,
  ONBOARDING_STEPS,
  type OnboardingAnswers,
  type OnboardingStepId,
} from '../domain/onboardingFlow';

/** Step machine for the first-run funnel. Pure state + analytics; no navigation. */
export function useOnboardingFlow() {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<OnboardingAnswers>(EMPTY_ONBOARDING_ANSWERS);
  const [giftOpened, setGiftOpened] = useState(false);
  /** Once the person picks an occasion themselves, picking a different audience stops overriding it. */
  const occasionTouched = useRef(false);

  const step: OnboardingStepId = ONBOARDING_STEPS[index] ?? 'who';
  const isFirst = index === 0;
  const isLast = index === ONBOARDING_STEPS.length - 1;

  useEffect(() => {
    trackEvent(AnalyticsEvents.onboardingStarted);
  }, []);

  useEffect(() => {
    trackEvent(AnalyticsEvents.onboardingStepViewed, { step, index: index + 1 });
  }, [index, step]);

  const chooseAudience = useCallback((audience: Audience) => {
    trackEvent(AnalyticsEvents.onboardingAudiencePicked, { audience });
    setAnswers((prev) => ({
      ...prev,
      audience,
      occasion: occasionTouched.current && prev.occasion ? prev.occasion : defaultOccasionFor(audience),
    }));
  }, []);

  const chooseOccasion = useCallback((occasion: Occasion) => {
    occasionTouched.current = true;
    trackEvent(AnalyticsEvents.onboardingOccasionPicked, { occasion });
    setAnswers((prev) => ({ ...prev, occasion }));
  }, []);

  const chooseDate = useCallback((dateText: string) => {
    setAnswers((prev) => ({ ...prev, dateText }));
    if (dateText) {
      trackEvent(AnalyticsEvents.onboardingDateSet);
    }
  }, []);

  const openGift = useCallback(() => {
    setGiftOpened(true);
    trackEvent(AnalyticsEvents.onboardingGiftOpened);
  }, []);

  const next = useCallback(() => {
    setIndex((i) =>
      canContinue(ONBOARDING_STEPS[i] ?? 'who', answers)
        ? Math.min(i + 1, ONBOARDING_STEPS.length - 1)
        : i,
    );
  }, [answers]);

  /** Not knowing the date must never be a dead end: carry on, with nothing said about days. */
  const skipDate = useCallback(() => {
    trackEvent(AnalyticsEvents.onboardingDateSkipped);
    setAnswers((prev) => ({ ...prev, dateText: '' }));
    setIndex((i) => Math.min(i + 1, ONBOARDING_STEPS.length - 1));
  }, []);

  const back = useCallback(() => {
    setIndex((i) => Math.max(i - 1, 0));
  }, []);

  /** The "I won't forget" tap on the fear step: one event, then on to the relief. */
  const pledge = useCallback(() => {
    trackEvent(AnalyticsEvents.onboardingPledged, { hasDate: daysUntilDate(answers) !== null });
    setIndex((i) => Math.min(i + 1, ONBOARDING_STEPS.length - 1));
  }, [answers]);

  return {
    index,
    step,
    total: ONBOARDING_STEPS.length,
    isFirst,
    isLast,
    answers,
    giftOpened,
    daysUntil: daysUntilDate(answers),
    canContinue: canContinue(step, answers),
    chooseAudience,
    chooseOccasion,
    chooseDate,
    openGift,
    next,
    skipDate,
    pledge,
    back,
  };
}
