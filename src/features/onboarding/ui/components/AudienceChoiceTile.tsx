import { Check } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { Text } from '../../../../shared/ui/Text';
import { colors, radius, spacing, typography } from '../../../../shared/theme/tokens';
import {
  AUDIENCE_ICONS,
  AUDIENCE_TONES,
} from '../../../create/ui/components/AudienceCard';
import type { Audience } from '../../../create/domain/templateSchema';

const SPRING = { damping: 18, stiffness: 420, mass: 0.6 };
/** Unselected tiles carry no outline, so only the chosen one reads as chosen. */
const IDLE_BORDER = 'transparent';

type Props = {
  audience: Audience;
  label: string;
  cue: string;
  index: number;
  selected: boolean;
  onPress: () => void;
};

/** A selectable twin of the Create-home audience card: same colours and icons, with a chosen state. */
export function AudienceChoiceTile({ audience, label, cue, index, selected, onPress }: Props) {
  const tone = AUDIENCE_TONES[audience];
  const Icon = AUDIENCE_ICONS[audience];
  const scale = useSharedValue(1);
  const check = useSharedValue(selected ? 1 : 0);

  useEffect(() => {
    check.value = withSpring(selected ? 1 : 0, SPRING);
    if (selected) {
      scale.value = withSpring(1.03, SPRING);
      const settle = setTimeout(() => {
        scale.value = withSpring(1, SPRING);
      }, 140);
      return () => clearTimeout(settle);
    }
    return undefined;
  }, [check, scale, selected]);

  const cardStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const checkStyle = useAnimatedStyle(() => ({
    opacity: check.value,
    transform: [{ scale: 0.6 + check.value * 0.4 }],
  }));

  return (
    <Animated.View
      entering={FadeInDown.delay(60 + index * 55).duration(320)}
      style={styles.slot}
    >
      <Pressable
        accessibilityRole="radio"
        accessibilityState={{ selected }}
        accessibilityLabel={`${label}. ${cue}`}
        onPress={onPress}
        onPressIn={() => {
          scale.value = withSpring(0.96, SPRING);
        }}
        onPressOut={() => {
          scale.value = withSpring(selected ? 1.03 : 1, SPRING);
        }}
      >
        <Animated.View
          style={[
            styles.card,
            { backgroundColor: tone.soft, borderColor: selected ? tone.tile : IDLE_BORDER },
            selected && styles.cardSelected,
            cardStyle,
          ]}
        >
          <View style={[styles.icon, { backgroundColor: tone.tile }]}>
            <Icon size={20} color={tone.iconColor} strokeWidth={2.2} absoluteStrokeWidth />
          </View>
          <Text style={styles.label} numberOfLines={1}>
            {label}
          </Text>
          <Text style={styles.cue} numberOfLines={2}>
            {cue}
          </Text>
          <Animated.View style={[styles.badge, { backgroundColor: tone.tile }, checkStyle]}>
            <Check size={13} color={tone.iconColor} strokeWidth={3} />
          </Animated.View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  slot: { width: '48%' },
  card: {
    minHeight: 112,
    borderWidth: 1.5,
    borderRadius: radius.lg,
    padding: spacing.sm + 2,
    gap: 3,
  },
  cardSelected: { borderWidth: 2.5 },
  icon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  label: {
    fontSize: typography.sizeMd,
    lineHeight: typography.sizeMd * 1.25,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
  },
  cue: {
    fontSize: typography.sizeXs,
    lineHeight: typography.sizeXs * 1.35,
    fontWeight: typography.weightMedium,
    color: colors.inkSoft,
  },
  badge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
