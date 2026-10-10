import { useEffect } from 'react';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import { AnalyticsEvents, trackEvent } from '../../../shared/analytics/events';
import type { RootStackParamList } from '../../../shared/navigation/types';
import { useCreateDraftContext } from '../../create/application/CreateDraftContext';
import { takePendingOnboardingIntent } from './onboardingHandoff';

/**
 * Right after onboarding, start the first card with what the person already
 * told us (who it is for, what they are celebrating) and land on the photo
 * step. Waits for the saved draft to load so it is never overwritten.
 */
export function useOnboardingHandoff(): void {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { startFromAudience, setOccasion, isHydrated } = useCreateDraftContext();

  useEffect(() => {
    if (!isHydrated) {
      return;
    }
    const intent = takePendingOnboardingIntent();
    if (!intent) {
      return;
    }
    startFromAudience(intent.audience);
    setOccasion(intent.occasion);
    trackEvent(AnalyticsEvents.onboardingFirstCardStarted, {
      audience: intent.audience,
      occasion: intent.occasion,
    });
    navigation.navigate('MainTabs', {
      screen: 'CreateTab',
      params: {
        state: {
          index: 1,
          routes: [{ name: 'CreateHome' }, { name: 'AddPhotos' }],
        },
      },
    });
  }, [isHydrated, navigation, setOccasion, startFromAudience]);
}
