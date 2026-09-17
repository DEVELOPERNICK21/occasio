import { useEffect } from 'react';
import { AccessibilityInfo } from 'react-native';
import {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { CARD_REVEAL } from '../../domain/cardReveal';

const ease = Easing.out(Easing.cubic);

function runBeat(
  value: { value: number },
  delayMs: number,
  durationMs: number,
  reduceMotion: boolean,
) {
  if (reduceMotion) {
    value.value = 1;
    return;
  }
  value.value = 0;
  value.value = withDelay(
    delayMs,
    withTiming(1, { duration: durationMs, easing: ease }),
  );
}

/**
 * Four-beat invitation reveal. Remount/restart by changing `replayKey`.
 */
export function useCardReveal(replayKey: number, enabled = true) {
  const photo = useSharedValue(enabled ? 0 : 1);
  const occasion = useSharedValue(enabled ? 0 : 1);
  const name = useSharedValue(enabled ? 0 : 1);
  const message = useSharedValue(enabled ? 0 : 1);

  useEffect(() => {
    if (!enabled) {
      photo.value = 1;
      occasion.value = 1;
      name.value = 1;
      message.value = 1;
      return;
    }

    let cancelled = false;
    void AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (cancelled) return;
      runBeat(photo, CARD_REVEAL.photoAt, CARD_REVEAL.photoMs, reduceMotion);
      runBeat(
        occasion,
        CARD_REVEAL.occasionAt,
        CARD_REVEAL.occasionMs,
        reduceMotion,
      );
      runBeat(name, CARD_REVEAL.nameAt, CARD_REVEAL.nameMs, reduceMotion);
      runBeat(
        message,
        CARD_REVEAL.messageAt,
        CARD_REVEAL.messageMs,
        reduceMotion,
      );
    });

    return () => {
      cancelled = true;
    };
  }, [replayKey, enabled, photo, occasion, name, message]);

  const photoStyle = useAnimatedStyle(() => ({
    opacity: photo.value,
    transform: [{ scale: 0.96 + photo.value * 0.04 }],
  }));

  const occasionStyle = useAnimatedStyle(() => ({
    opacity: occasion.value,
    transform: [{ translateY: (1 - occasion.value) * 10 }],
  }));

  const nameStyle = useAnimatedStyle(() => ({
    opacity: name.value,
    transform: [{ translateY: (1 - name.value) * 16 }],
  }));

  const messageStyle = useAnimatedStyle(() => ({
    opacity: message.value,
    transform: [{ translateY: (1 - message.value) * 12 }],
  }));

  return { photoStyle, occasionStyle, nameStyle, messageStyle };
}
