import { useEffect, useId, useState } from 'react';
import {
  AccessibilityInfo,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { colors, radius } from '../theme/tokens';

type Props = {
  width?: number | `${number}%`;
  height: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * A soft highlight sweeps across the block, the way a shimmer does. Finite on
 * purpose (about a minute): a screen still waiting after that has bigger
 * problems than a sweep, and a loop that never ends keeps the accessibility
 * tree busy.
 */
const SHIMMER_MS = 1300;
const SHIMMER_CYCLES = 45;
/** The highlight is this share of the block's width, never narrower than the minimum. */
const BAND_SHARE = 0.6;
const BAND_MIN = 48;
const BAND_PEAK_OPACITY = 0.6;
/** Reduced motion gets a still, slightly lifted block instead of a sweep. */
const STILL_OPACITY = 0.7;

/** Shimmer placeholder block — honors reduced motion. */
export function SkeletonBone({
  width = '100%',
  height,
  borderRadius = radius.sm,
  style,
}: Props) {
  const sweep = useSharedValue(0);
  const gradientId = useId().replace(/:/g, '');
  const [reduceMotion, setReduceMotion] = useState(false);
  const [measured, setMeasured] = useState(0);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  }, []);

  useEffect(() => {
    if (reduceMotion) return undefined;
    sweep.value = 0;
    sweep.value = withRepeat(
      withTiming(1, { duration: SHIMMER_MS, easing: Easing.inOut(Easing.quad) }),
      SHIMMER_CYCLES,
      false,
    );
    return () => cancelAnimation(sweep);
  }, [reduceMotion, sweep]);

  const bandWidth = Math.max(measured * BAND_SHARE, BAND_MIN);
  const sweepStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -bandWidth + sweep.value * (measured + bandWidth) }],
  }));

  const onLayout = (event: LayoutChangeEvent) => {
    const next = Math.round(event.nativeEvent.layout.width);
    if (next !== measured) setMeasured(next);
  };

  return (
    <View
      onLayout={onLayout}
      style={[
        styles.bone,
        { width, height, borderRadius },
        reduceMotion && styles.still,
        style,
      ]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {!reduceMotion && measured > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={[styles.band, { width: bandWidth }, sweepStyle]}
        >
          <Svg width="100%" height="100%" preserveAspectRatio="none">
            <Defs>
              <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor={colors.white} stopOpacity={0} />
                <Stop offset="0.5" stopColor={colors.white} stopOpacity={BAND_PEAK_OPACITY} />
                <Stop offset="1" stopColor={colors.white} stopOpacity={0} />
              </LinearGradient>
            </Defs>
            <Rect width="100%" height="100%" fill={`url(#${gradientId})`} />
          </Svg>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bone: {
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  still: {
    opacity: STILL_OPACITY,
  },
  band: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
  },
});
