import { useCallback, useEffect, useState } from 'react';
import {
  readOnboardingCompleted,
  writeOnboardingCompleted,
} from '../data/onboardingStorage';

export type OnboardingStatus = 'loading' | 'pending' | 'complete';

export function useOnboarding() {
  const [status, setStatus] = useState<OnboardingStatus>('loading');

  useEffect(() => {
    let active = true;

    readOnboardingCompleted()
      .then((completed) => {
        if (active) {
          setStatus(completed ? 'complete' : 'pending');
        }
      })
      .catch(() => {
        if (active) {
          setStatus('pending');
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const completeOnboarding = useCallback(async () => {
    await writeOnboardingCompleted();
    setStatus('complete');
  }, []);

  return { status, completeOnboarding };
}
