import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
} from 'react-native-reanimated';
import { Lock } from 'lucide-react-native';
import { Text } from '../../../../shared/ui/Text';
import { colors, spacing, typography } from '../../../../shared/theme/tokens';
import type { WishBadgeId } from '../../domain/wishJourney';
import { BADGE_STYLE } from './badgeStyle';

type Props = {
  id: WishBadgeId;
  label: string;
  unlocked: boolean;
  /** Position in a row, for the staggered pop-in. */
  index?: number;
  /** Circle size in px. */
  size?: number;
  selected?: boolean;
  onPress?: () => void;
};

/** One badge: a coloured circle when earned, a dashed lock when not, with its name under it. */
export function BadgeMedal({ id, label, unlocked, index = 0, size = 44, selected = false, onPress }: Props) {
  const pop = useSharedValue(0);
  const tone = BADGE_STYLE[id];
  const Icon = unlocked ? tone.icon : Lock;

  useEffect(() => {
    pop.value = withDelay(180 + index * 70, withSpring(1, { damping: 10, stiffness: 160 }));
  }, [index, pop]);

  const style = useAnimatedStyle(() => ({
    opacity: pop.value,
    transform: [{ scale: 0.6 + pop.value * 0.4 }],
  }));

  return (
    <Animated.View style={style}>
      <Pressable
        accessibilityRole={onPress ? 'button' : undefined}
        accessibilityLabel={`${label} badge, ${unlocked ? 'earned' : 'locked'}`}
        accessibilityState={{ selected }}
        disabled={!onPress}
        onPress={onPress}
        hitSlop={4}
        style={styles.cell}
      >
        <View
          style={[
            styles.circle,
            { width: size, height: size, borderRadius: size / 2 },
            unlocked
              ? { backgroundColor: tone.soft, borderColor: tone.color }
              : styles.locked,
            selected && styles.selected,
          ]}
        >
          <Icon
            size={unlocked ? size * 0.42 : size * 0.32}
            color={unlocked ? tone.color : colors.muted}
            fill={unlocked && id === 'first_wish' ? tone.color : 'transparent'}
            strokeWidth={2}
            absoluteStrokeWidth
          />
        </View>
        <Text style={[styles.label, !unlocked && styles.labelLocked]} numberOfLines={2}>
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cell: {
    alignItems: 'center',
    gap: spacing.xs,
    minWidth: 56,
  },
  circle: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locked: {
    backgroundColor: colors.bg,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  selected: {
    borderColor: colors.ink,
  },
  label: {
    fontSize: typography.sizeXs,
    lineHeight: typography.sizeXs * 1.2,
    fontWeight: typography.weightSemibold,
    color: colors.inkSoft,
    textAlign: 'center',
  },
  labelLocked: {
    color: colors.muted,
  },
});
