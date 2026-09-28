import {
  Gem,
  Heart,
  Home,
  Shield,
  Sparkles,
  Users,
  type LucideIcon,
} from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { Text } from '../../../../shared/ui/Text';
import { colors, radius, shadow, spacing, typography } from '../../../../shared/theme/tokens';
import type { Audience } from '../../domain/templateSchema';

const PRESS_SPRING = { damping: 20, stiffness: 520, mass: 0.6 };

type AudienceTone = {
  /** Solid icon tile. */
  tile: string;
  iconColor: string;
  /** Card tint. */
  soft: string;
  border: string;
};

/** One warm colour per relationship — helps the grid scan at a glance. */
const AUDIENCE_TONES: Record<Audience, AudienceTone> = {
  someone_special: {
    tile: colors.accent,
    iconColor: colors.white,
    soft: colors.sidebar,
    border: colors.accentSoft,
  },
  mom: {
    tile: colors.rose,
    iconColor: colors.white,
    soft: colors.roseSoft,
    border: colors.roseSoft,
  },
  dad: {
    tile: colors.sage,
    iconColor: colors.white,
    soft: colors.sageSoft,
    border: colors.sageSoft,
  },
  friend: {
    tile: colors.secondary,
    iconColor: colors.white,
    soft: colors.amberSoft,
    border: colors.amberSoft,
  },
  partner: {
    tile: colors.accentHover,
    iconColor: colors.white,
    soft: colors.roseSoft,
    border: colors.accentSoft,
  },
  family: {
    tile: colors.butter,
    iconColor: colors.ink,
    soft: colors.butterSoft,
    border: colors.butterSoft,
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
  /** Grid position — staggers the entrance. */
  index?: number;
  onPress: () => void;
};

export function AudienceCard({ audience, label, cue, index = 0, onPress }: Props) {
  const scale = useSharedValue(1);
  const wiggle = useSharedValue(0);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const tone = AUDIENCE_TONES[audience];
  const Icon = AUDIENCE_ICONS[audience];

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${wiggle.value * 12}deg` }, { scale: 1 + Math.abs(wiggle.value) * 0.12 }],
  }));

  return (
    <Animated.View
      entering={FadeInDown.delay(120 + index * 70).springify().damping(14)}
      style={styles.slot}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}. ${cue}`}
        accessibilityHint="Choose the moment next"
        onPress={onPress}
        onPressIn={() => {
          scale.value = withSpring(0.95, PRESS_SPRING);
          wiggle.value = withSequence(
            withTiming(-1, { duration: 70 }),
            withTiming(1, { duration: 110 }),
            withTiming(0, { duration: 90 }),
          );
        }}
        onPressOut={() => {
          scale.value = withSpring(1, PRESS_SPRING);
        }}
        android_ripple={{ color: tone.border, borderless: false }}
      >
        {({ pressed }) => (
          <View style={[styles.shadowShell, { shadowColor: tone.tile }]}>
            <Animated.View
              style={[
                styles.card,
                { backgroundColor: tone.soft, borderColor: tone.border },
                cardStyle,
                pressed && { borderColor: tone.tile },
              ]}
              onLayout={(e) => {
                const { width, height } = e.nativeEvent.layout;
                if (width !== size.width || height !== size.height) setSize({ width, height });
              }}
            >
              <View style={[styles.blob, { backgroundColor: tone.tile }]} />
              {size.width > 0 ? (
                <Svg
                  style={StyleSheet.absoluteFill}
                  width={size.width}
                  height={size.height}
                  pointerEvents="none"
                >
                  <Defs>
                    <LinearGradient id={`gloss-${audience}`} x1="0" y1="0" x2="0" y2="1">
                      <Stop offset="0%" stopColor={colors.white} stopOpacity={0.75} />
                      <Stop offset="100%" stopColor={colors.white} stopOpacity={0} />
                    </LinearGradient>
                  </Defs>
                  <Rect
                    x={0}
                    y={0}
                    width={size.width}
                    height={size.height * 0.58}
                    fill={`url(#gloss-${audience})`}
                  />
                </Svg>
              ) : null}
              <View style={styles.body}>
                <Animated.View
                  style={[
                    styles.iconWrap,
                    { backgroundColor: tone.tile, shadowColor: tone.tile },
                    iconStyle,
                  ]}
                >
                  <View style={styles.iconShine} />
                  <Icon
                    size={20}
                    color={tone.iconColor}
                    fill={audience === 'mom' ? tone.iconColor : 'transparent'}
                    strokeWidth={2.2}
                    absoluteStrokeWidth
                  />
                </Animated.View>
                <Text style={styles.label} numberOfLines={1}>
                  {label}
                </Text>
                <Text style={styles.cue} numberOfLines={2}>
                  {cue}
                </Text>
              </View>
            </Animated.View>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  slot: {
    width: '48%',
  },
  shadowShell: {
    borderRadius: radius.lg,
    ...shadow.card,
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  card: {
    minHeight: 128,
    borderWidth: 1.5,
    borderTopColor: colors.white,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  blob: {
    position: 'absolute',
    right: -22,
    top: -22,
    width: 72,
    height: 72,
    borderRadius: 36,
    opacity: 0.16,
  },
  body: {
    flex: 1,
    paddingHorizontal: spacing.sm + 2,
    paddingTop: spacing.sm + 2,
    paddingBottom: spacing.md,
    gap: 3,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
    shadowOpacity: 0.35,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  iconShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '48%',
    backgroundColor: colors.white,
    opacity: 0.28,
    borderTopLeftRadius: radius.md,
    borderTopRightRadius: radius.md,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
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
});
