import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Line } from 'react-native-svg';
import { colors } from '../../../../../shared/theme/tokens';

type Props = {
  left: number;
  top: number;
  size: number;
  delayMs: number;
  color: string;
  replayKey: number;
};

/** Soft twinkle — cross spark + glow. */
export function SoftSparkle({ left, top, size, delayMs, color, replayKey }: Props) {
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = 0;
    pulse.value = withDelay(
      delayMs,
      withRepeat(
        withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
        -1,
        true,
      ),
    );
  }, [delayMs, pulse, replayKey]);

  const style = useAnimatedStyle(() => ({
    opacity: 0.25 + pulse.value * 0.75,
    transform: [{ scale: 0.55 + pulse.value * 0.7 }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.wrap, { left: left - size / 2, top: top - size / 2, width: size, height: size }, style]}
    >
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Circle cx="12" cy="12" r="3.2" fill={color} opacity={0.35} />
        <Line x1="12" y1="2" x2="12" y2="22" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
        <Line x1="2" y1="12" x2="22" y2="12" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
        <Line x1="5" y1="5" x2="19" y2="19" stroke={colors.white} strokeWidth="1.2" strokeLinecap="round" opacity={0.7} />
        <Line x1="19" y1="5" x2="5" y2="19" stroke={colors.white} strokeWidth="1.2" strokeLinecap="round" opacity={0.7} />
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
  },
});
