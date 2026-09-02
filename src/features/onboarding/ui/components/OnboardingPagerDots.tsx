import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { colors, radius, spacing } from '../../../../shared/theme/tokens';

type Props = {
  count: number;
  activeIndex: number;
};

function AnimatedDot({ active }: { active: boolean }) {
  const width = useSharedValue(active ? 28 : 8);
  const opacity = useSharedValue(active ? 1 : 0.45);

  useEffect(() => {
    width.value = withSpring(active ? 28 : 8, { damping: 18, stiffness: 220 });
    opacity.value = withSpring(active ? 1 : 0.45, { damping: 18, stiffness: 220 });
  }, [active, opacity, width]);

  const style = useAnimatedStyle(() => ({
    width: width.value,
    opacity: opacity.value,
  }));

  return <Animated.View style={[styles.dot, style]} />;
}

export function OnboardingPagerDots({ count, activeIndex }: Props) {
  return (
    <View
      style={styles.row}
      accessibilityRole="tablist"
      accessibilityLabel={`Slide ${activeIndex + 1} of ${count}`}
    >
      {Array.from({ length: count }, (_, index) => (
        <AnimatedDot key={index} active={index === activeIndex} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  dot: {
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
  },
});
