import { useEffect, useState } from 'react';
import { AccessibilityInfo, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { colors, radius } from '../theme/tokens';

type Props = {
  width?: number | `${number}%`;
  height: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
};

/** Shimmer placeholder block — honors reduced motion. */
export function SkeletonBone({
  width = '100%',
  height,
  borderRadius = radius.sm,
  style,
}: Props) {
  const opacity = useSharedValue(0.5);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      opacity.value = 0.55;
      return;
    }

    opacity.value = withRepeat(
      withSequence(
        withTiming(0.82, { duration: 850 }),
        withTiming(0.42, { duration: 850 }),
      ),
      -1,
      false,
    );

    return () => {
      cancelAnimation(opacity);
    };
  }, [opacity, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.bone,
        { width, height, borderRadius },
        animatedStyle,
        style,
      ]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}

const styles = StyleSheet.create({
  bone: {
    backgroundColor: colors.border,
  },
});
