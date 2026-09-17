import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useCelebrationSound } from '../../application/useCelebrationSound';
import { CARD_REVEAL } from '../../domain/cardReveal';
import { effectForMoment } from '../../domain/occasionEffects';
import type { Occasion } from '../../domain/templateSchema';
import type { TemplateType } from '../../domain/types';
import { PremiumScreenEffect } from './effects/PremiumScreenEffect';

/** Pause after an effect finishes before auto-replaying. */
const REPLAY_GAP_MS = 4000;

type Props = {
  occasion: Occasion | null;
  templateType?: TemplateType | null;
  /** Stage height — defaults to ~half the screen. */
  height?: number;
  replayKey?: number;
  /** Wait for staged card reveal before starting the effect. */
  startDelayMs?: number;
};

/**
 * Screen celebration after the letter reveal — visuals + soft occasion sound.
 */
export function OccasionStickerShower({
  occasion,
  templateType,
  height,
  replayKey = 0,
  startDelayMs = CARD_REVEAL.celebrationAt,
}: Props) {
  const { height: windowHeight } = useWindowDimensions();
  const stageHeight = height ?? Math.min(560, Math.round(windowHeight * 0.62));
  const [reduceMotion, setReduceMotion] = useState(false);
  const [cycleKey, setCycleKey] = useState(0);
  const [ready, setReady] = useState(startDelayMs <= 0);
  const gapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReduceMotion(enabled);
    });
    const sub = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion,
    );
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  useEffect(() => {
    setCycleKey(0);
    if (gapTimer.current) {
      clearTimeout(gapTimer.current);
      gapTimer.current = null;
    }
    if (startTimer.current) {
      clearTimeout(startTimer.current);
      startTimer.current = null;
    }
    if (startDelayMs <= 0) {
      setReady(true);
      return;
    }
    setReady(false);
    startTimer.current = setTimeout(() => {
      setReady(true);
    }, startDelayMs);
    return () => {
      if (startTimer.current) clearTimeout(startTimer.current);
    };
  }, [replayKey, occasion, templateType, startDelayMs]);

  useEffect(() => {
    return () => {
      if (gapTimer.current) clearTimeout(gapTimer.current);
      if (startTimer.current) clearTimeout(startTimer.current);
    };
  }, []);

  const effectId = useMemo(
    () => effectForMoment(occasion, templateType),
    [occasion, templateType],
  );

  // Music beds play once per reveal — not on every visual auto-replay.
  useCelebrationSound(effectId, replayKey, ready && !reduceMotion);

  const handleFinish = useCallback(() => {
    if (gapTimer.current) clearTimeout(gapTimer.current);
    gapTimer.current = setTimeout(() => {
      setCycleKey((k) => k + 1);
    }, REPLAY_GAP_MS);
  }, []);

  if (reduceMotion || !ready) {
    return null;
  }

  return (
    <View
      pointerEvents="none"
      style={[styles.host, { height: stageHeight }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <PremiumScreenEffect
        key={`${effectId}-${replayKey}-${cycleKey}`}
        effectId={effectId}
        height={stageHeight}
        replayKey={replayKey + cycleKey}
        onFinished={handleFinish}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    elevation: 20,
    overflow: 'visible',
  },
});
