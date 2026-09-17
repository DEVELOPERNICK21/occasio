import { useEffect } from 'react';
import {
  playCelebrationSound,
  stopCelebrationSound,
} from '../data/celebrationSound';
import type { ScreenEffectId } from '../domain/occasionEffects';
import { triggerSuccessHaptic } from '../../../shared/platform/haptics';

/**
 * Plays the soft occasion chime (+ light haptic) when a celebration starts.
 */
export function useCelebrationSound(
  effectId: ScreenEffectId,
  playKey: number,
  enabled: boolean,
): void {
  useEffect(() => {
    if (!enabled) {
      stopCelebrationSound();
      return;
    }
    playCelebrationSound(effectId);
    triggerSuccessHaptic();
    return () => {
      stopCelebrationSound();
    };
  }, [effectId, playKey, enabled]);
}
