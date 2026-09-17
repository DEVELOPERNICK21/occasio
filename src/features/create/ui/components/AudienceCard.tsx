import {
  Gem,
  Heart,
  Home,
  Shield,
  Sparkles,
  Users,
  type LucideIcon,
} from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Text } from '../../../../shared/ui/Text';
import { CardWashBackground } from '../../../../shared/ui/CardWashBackground';
import { colors, radius, shadow, spacing, typography } from '../../../../shared/theme/tokens';
import type { Audience } from '../../domain/templateSchema';

const PRESS_SPRING = { damping: 20, stiffness: 520, mass: 0.6 };

type AudienceTone = {
  washPrimary: string;
  washSecondary: string;
  iconBg: string;
  iconColor: string;
  cueColor: string;
};

/** Soft, distinct warmth per relationship — tokens only, not accent-on-everything. */
const AUDIENCE_TONES: Record<Audience, AudienceTone> = {
  someone_special: {
    washPrimary: colors.tertiary,
    washSecondary: colors.secondary,
    iconBg: colors.sidebar,
    iconColor: colors.accent,
    cueColor: colors.inkSoft,
  },
  mom: {
    washPrimary: colors.accentSoft,
    washSecondary: colors.tertiary,
    iconBg: colors.sidebar,
    iconColor: colors.accent,
    cueColor: colors.inkSoft,
  },
  dad: {
    washPrimary: colors.neutral,
    washSecondary: colors.tertiary,
    iconBg: colors.sidebar,
    iconColor: colors.neutral,
    cueColor: colors.inkSoft,
  },
  friend: {
    washPrimary: colors.secondary,
    washSecondary: colors.tertiary,
    iconBg: colors.sidebar,
    iconColor: colors.secondary,
    cueColor: colors.inkSoft,
  },
  partner: {
    washPrimary: colors.accentSoft,
    washSecondary: colors.accent,
    iconBg: colors.sidebar,
    iconColor: colors.accent,
    cueColor: colors.inkSoft,
  },
  family: {
    washPrimary: colors.tertiary,
    washSecondary: colors.secondary,
    iconBg: colors.sidebar,
    iconColor: colors.neutral,
    cueColor: colors.inkSoft,
  },
};

const AUDIENCE_ICONS: Record<Audience, LucideIcon> = {
  someone_special: Sparkles,
  mom: Heart,
  dad: Shield,
  friend: Users,
  partner: Gem,
  family: Home,
};

type Props = {
  audience: Audience;
  label: string;
  cue: string;
  onPress: () => void;
};

export function AudienceCard({ audience, label, cue, onPress }: Props) {
  const scale = useSharedValue(1);
  const tone = AUDIENCE_TONES[audience];
  const Icon = AUDIENCE_ICONS[audience];

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}. ${cue}`}
      accessibilityHint="Choose the moment next"
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.96, PRESS_SPRING);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, PRESS_SPRING);
      }}
      android_ripple={{ color: tone.iconBg, borderless: false }}
      style={styles.pressable}
    >
      {({ pressed }) => (
        <View style={styles.shadowShell}>
          <Animated.View
            style={[
              styles.card,
              animatedStyle,
              pressed && { borderColor: tone.iconColor },
            ]}
          >
            <CardWashBackground
              variant="upcoming"
              primary={tone.washPrimary}
              secondary={tone.washSecondary}
            />
            <View style={styles.body}>
              <View style={[styles.iconWrap, { backgroundColor: tone.iconBg }]}>
                <Icon
                  size={18}
                  color={tone.iconColor}
                  strokeWidth={2}
                  absoluteStrokeWidth
                />
              </View>
              <Text style={styles.label} numberOfLines={1}>
                {label}
              </Text>
              <Text style={[styles.cue, { color: tone.cueColor }]} numberOfLines={2}>
                {cue}
              </Text>
            </View>
          </Animated.View>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    width: '48%',
  },
  shadowShell: {
    borderRadius: radius.lg,
    ...shadow.card,
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 2,
  },
  card: {
    minHeight: 118,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  body: {
    zIndex: 1,
    flex: 1,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: 3,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  label: {
    fontSize: typography.sizeSm,
    lineHeight: typography.sizeSm * 1.25,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
  },
  cue: {
    fontSize: typography.sizeXs,
    lineHeight: typography.sizeXs * 1.35,
    fontWeight: typography.weightMedium,
  },
});
