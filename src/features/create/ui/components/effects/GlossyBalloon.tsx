import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, Ellipse, Line, RadialGradient, Stop } from 'react-native-svg';

type Props = {
  left: number;
  size: number;
  color: string;
  highlight: string;
  shadow: string;
  delayMs: number;
  durationMs: number;
  fallDistance: number;
  sway: number;
  replayKey: number;
};

/** Glossy balloon — radial highlight + string (closer to iMessage than flat Lottie shapes). */
export function GlossyBalloon({
  left,
  size,
  color,
  highlight,
  shadow,
  delayMs,
  durationMs,
  fallDistance,
  sway,
  replayKey,
}: Props) {
  const progress = useSharedValue(0);
  const gid = `b-${left}-${size}-${replayKey}`;

  useEffect(() => {
    progress.value = 0;
    progress.value = withDelay(
      delayMs,
      withTiming(1, { duration: durationMs, easing: Easing.linear }),
    );
  }, [delayMs, durationMs, progress, replayKey]);

  const style = useAnimatedStyle(() => {
    const y = fallDistance + 40 - progress.value * (fallDistance + 120);
    const xSway = Math.sin(progress.value * Math.PI * 2) * sway;
    const fade =
      progress.value < 0.08
        ? progress.value / 0.08
        : progress.value > 0.9
          ? (1 - progress.value) / 0.1
          : 1;
    return {
      opacity: fade,
      transform: [
        { translateX: xSway },
        { translateY: y },
        { scale: 0.85 + progress.value * 0.2 },
      ],
    };
  });

  const w = size;
  const h = size * 1.2;

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.wrap, { left: left - w / 2, width: w, height: h + 40 }, style]}
    >
      <Svg width={w} height={h + 40}>
        <Defs>
          <RadialGradient id={gid} cx="35%" cy="30%" rx="65%" ry="65%">
            <Stop offset="0%" stopColor={highlight} stopOpacity="1" />
            <Stop offset="45%" stopColor={color} stopOpacity="1" />
            <Stop offset="100%" stopColor={shadow} stopOpacity="1" />
          </RadialGradient>
        </Defs>
        <Ellipse
          cx={w / 2}
          cy={h * 0.92}
          rx={w * 0.28}
          ry={h * 0.08}
          fill="#2A2220"
          opacity={0.18}
        />
        <Ellipse cx={w / 2} cy={h * 0.42} rx={w * 0.46} ry={h * 0.42} fill={`url(#${gid})`} />
        <Ellipse
          cx={w * 0.34}
          cy={h * 0.28}
          rx={w * 0.12}
          ry={h * 0.16}
          fill="#FFFFFF"
          opacity={0.45}
        />
        <Ellipse cx={w / 2} cy={h * 0.82} rx={w * 0.08} ry={h * 0.05} fill={shadow} />
        <Line
          x1={w / 2}
          y1={h * 0.86}
          x2={w / 2}
          y2={h + 36}
          stroke="#FFFFFF"
          strokeWidth={1.4}
          strokeOpacity={0.55}
        />
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
