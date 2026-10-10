import { ChevronLeft } from 'lucide-react-native';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Text } from '../../../../shared/ui/Text';
import { colors, radius, spacing, typography } from '../../../../shared/theme/tokens';
import { progressLabel } from '../../domain/onboardingFlow';

type Props = {
  index: number;
  total: number;
  onBack?: () => void;
  onSkip: () => void;
};

function Segment({ filled }: { filled: boolean }) {
  const fill = useSharedValue(filled ? 1 : 0);

  useEffect(() => {
    fill.value = withSpring(filled ? 1 : 0, { damping: 20, stiffness: 180 });
  }, [fill, filled]);

  const fillStyle = useAnimatedStyle(() => ({ width: `${fill.value * 100}%` }));

  return (
    <View style={styles.segment}>
      <Animated.View style={[styles.segmentFill, fillStyle]} />
    </View>
  );
}

/** Back, five-segment progress (the current step is already filled), and Skip. */
export function OnboardingHeader({ index, total, onBack, onSkip }: Props) {
  return (
    <View style={styles.root}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back"
        disabled={!onBack}
        onPress={onBack}
        hitSlop={8}
        style={[styles.back, !onBack && styles.hidden]}
      >
        <ChevronLeft size={22} color={colors.inkSoft} strokeWidth={2.2} />
      </Pressable>

      <View
        style={styles.progress}
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={progressLabel(index)}
      >
        <View style={styles.segments}>
          {Array.from({ length: total }, (_, i) => (
            <Segment key={i} filled={i <= index} />
          ))}
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Skip onboarding"
        onPress={onSkip}
        hitSlop={12}
        style={({ pressed }) => [styles.skip, pressed && styles.pressed]}
      >
        <Text style={styles.skipLabel}>Skip</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  back: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hidden: { opacity: 0 },
  progress: { flex: 1 },
  segments: { flexDirection: 'row', gap: 6 },
  segment: {
    flex: 1,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  segmentFill: {
    height: '100%',
    borderRadius: radius.full,
    backgroundColor: colors.accent,
  },
  skip: { paddingVertical: spacing.xs, paddingHorizontal: spacing.sm },
  pressed: { opacity: 0.7 },
  skipLabel: {
    fontSize: typography.sizeMd,
    color: colors.muted,
    fontWeight: typography.weightMedium,
  },
});
