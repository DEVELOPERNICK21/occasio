import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, Path, RadialGradient, Stop } from 'react-native-svg';

type Props = {
  left: number;
  size: number;
  color: string;
  delayMs: number;
  durationMs: number;
  fallDistance: number;
  sway: number;
  replayKey: number;
};

const HEART_PATH =
  'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z';

/** Soft rising heart with gradient fill. */
export function RisingHeart({
  left,
  size,
  color,
  delayMs,
  durationMs,
  fallDistance,
  sway,
  replayKey,
}: Props) {
  const progress = useSharedValue(0);
  const gid = `h-${left}-${size}-${replayKey}`;

  useEffect(() => {
    progress.value = 0;
    progress.value = withDelay(
      delayMs,
      withTiming(1, { duration: durationMs, easing: Easing.out(Easing.cubic) }),
    );
  }, [delayMs, durationMs, progress, replayKey]);

  const style = useAnimatedStyle(() => {
    const y = fallDistance + 20 - progress.value * (fallDistance + 100);
    const xSway = Math.sin(progress.value * Math.PI * 1.5) * sway;
    const fade =
      progress.value < 0.1
        ? progress.value / 0.1
        : progress.value > 0.88
          ? (1 - progress.value) / 0.12
          : 1;
    return {
      opacity: fade,
      transform: [
        { translateX: xSway },
        { translateY: y },
        { scale: 0.7 + progress.value * 0.45 },
        { rotate: `${(1 - progress.value) * 12}deg` },
      ],
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.wrap, { left: left - size / 2, width: size, height: size }, style]}
    >
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Defs>
          <RadialGradient id={gid} cx="35%" cy="30%" r="70%">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.55" />
            <Stop offset="40%" stopColor={color} stopOpacity="1" />
            <Stop offset="100%" stopColor={color} stopOpacity="1" />
          </RadialGradient>
        </Defs>
        <Path d={HEART_PATH} fill={`url(#${gid})`} />
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0,
  },
});
