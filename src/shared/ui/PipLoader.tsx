import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Ellipse } from 'react-native-svg';
import { busyLine, isCalmBusy, lastBusyStageMs, type BusyKind } from '../mascot/busyLines';
import { useReduceMotion } from '../platform/useReduceMotion';
import { colors, spacing, typography } from '../theme/tokens';
import { Pip } from './Pip';
import { Text } from './Text';

type Props = {
  kind: BusyKind;
  /** Pip's width in px. */
  size?: number;
  /** Pip carries the wrapped gift (used while a card is being made). */
  holdsGift?: boolean;
};

/**
 * Pip hops on the spot while he waits, then rests. The motion is finite on
 * purpose: a long wait must never keep the screen's accessibility tree busy,
 * and by then the line has already said it is still working. When something is
 * being removed for good he only floats, slowly, rather than hopping.
 */
const MOTION = {
  playful: { height: 14, upMs: 420, downMs: 360, cycles: 24, shadowShrink: 0.4 },
  calm: { height: 4, upMs: 1000, downMs: 1000, cycles: 12, shadowShrink: 0.12 },
} as const;
const TICK_MS = 1000;
const PIP_BLINKS = 3;

/**
 * Where his feet are, as a share of his width: (shadow y 247 + the artwork's
 * 46 of headroom) over the 280-wide viewBox. The ground shadow sits there.
 */
const FEET_AT = 293 / 280;
const SHADOW_WIDTH = 0.57;
const SHADOW_HEIGHT = 0.065;
const SHADOW_OPACITY = 0.16;

/** Milliseconds since mount, ticking until the last line has appeared. */
function useElapsedMs(stopAtMs: number): number {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const startedAt = Date.now();
    const timer = setInterval(() => {
      const next = Date.now() - startedAt;
      setElapsed(next);
      if (next >= stopAtMs) clearInterval(timer);
    }, TICK_MS);
    return () => clearInterval(timer);
  }, [stopAtMs]);
  return elapsed;
}

/**
 * The wait, with a face. Pip hops, his shadow stays on the ground and shrinks as
 * he rises, and one calm line says what is happening, changing the longer it
 * takes so a slow connection never looks like a frozen app.
 */
export function PipLoader({ kind, size = 96, holdsGift = false }: Props) {
  const calm = isCalmBusy(kind);
  const motion = calm ? MOTION.calm : MOTION.playful;
  const reduceMotion = useReduceMotion();
  const hop = useSharedValue(0);
  const elapsed = useElapsedMs(lastBusyStageMs(kind));
  const line = busyLine(kind, elapsed);

  useEffect(() => {
    if (reduceMotion) return undefined;
    hop.value = withRepeat(
      withSequence(
        withTiming(1, { duration: motion.upMs, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: motion.downMs, easing: Easing.in(Easing.quad) }),
      ),
      motion.cycles,
      false,
    );
    return () => cancelAnimation(hop);
  }, [hop, motion, reduceMotion]);

  const bodyStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -hop.value * motion.height }],
  }));
  const shadowStyle = useAnimatedStyle(() => ({
    opacity: SHADOW_OPACITY * (1 - hop.value * motion.shadowShrink),
    transform: [{ scaleX: 1 - hop.value * motion.shadowShrink }],
  }));

  const pipHeight = (size * 310) / 280;
  const shadowWidth = size * SHADOW_WIDTH;
  const shadowHeight = Math.max(8, size * SHADOW_HEIGHT * 1.4);

  return (
    <View
      style={styles.root}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={line}
      accessibilityLiveRegion="polite"
    >
      <View style={{ width: size, height: pipHeight + motion.height }}>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.shadow,
            {
              width: shadowWidth,
              height: shadowHeight,
              left: (size - shadowWidth) / 2,
              top: motion.height + size * FEET_AT - shadowHeight / 2,
            },
            shadowStyle,
          ]}
        >
          <Svg width={shadowWidth} height={shadowHeight}>
            <Ellipse
              cx={shadowWidth / 2}
              cy={shadowHeight / 2}
              rx={shadowWidth / 2}
              ry={shadowHeight / 2}
              fill={colors.ink}
            />
          </Svg>
        </Animated.View>
        <Animated.View style={[{ marginTop: motion.height }, bodyStyle]}>
          <Pip
            mood="hopeful"
            size={size}
            holdsGift={holdsGift && !calm}
            bob={false}
            blinks={PIP_BLINKS}
            groundShadow={false}
          />
        </Animated.View>
      </View>
      <Text style={styles.line}>{line}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    gap: spacing.md,
  },
  shadow: {
    position: 'absolute',
  },
  line: {
    maxWidth: 260,
    fontSize: typography.sizeSm,
    lineHeight: typography.sizeSm * 1.45,
    fontWeight: typography.weightMedium,
    color: colors.inkSoft,
    textAlign: 'center',
  },
});
