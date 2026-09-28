import { useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  Pressable,
  StyleSheet,
  View,
  type DimensionValue,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, {
  Defs,
  Ellipse,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import { Gift, Heart, PartyPopper, Star, type LucideIcon } from 'lucide-react-native';
import { triggerTabHaptic } from '../../../../shared/platform/haptics';
import { Text } from '../../../../shared/ui/Text';
import { colors, radius, shadow, spacing, typography } from '../../../../shared/theme/tokens';

type Props = {
  greeting: string;
  headline: string;
  line: string;
};

type StickerSeed = {
  id: string;
  icon: LucideIcon;
  color: string;
  size: number;
  left: DimensionValue;
  top: DimensionValue;
  delayMs: number;
  fill: boolean;
};

type BalloonSeed = {
  id: string;
  color: string;
  left: DimensionValue;
  top: DimensionValue;
  delayMs: number;
  scale: number;
};

/**
 * Copy sits bottom-left (max 60% wide), so decorations stay in the top band
 * or the right column (left >= 70%) and never cover the headline.
 */
const STICKERS: readonly StickerSeed[] = [
  { id: 's-heart', icon: Heart, color: colors.rose, size: 18, left: '46%', top: '7%', delayMs: 120, fill: true },
  { id: 's-party', icon: PartyPopper, color: colors.accent, size: 16, left: '84%', top: '6%', delayMs: 720, fill: false },
  { id: 's-gift', icon: Gift, color: colors.secondary, size: 18, left: '82%', top: '46%', delayMs: 320, fill: false },
  { id: 's-star', icon: Star, color: colors.butter, size: 16, left: '72%', top: '76%', delayMs: 520, fill: true },
];

const BALLOONS: readonly BalloonSeed[] = [
  { id: 'b-coral', color: colors.accent, left: '66%', top: '6%', delayMs: 0, scale: 1 },
  { id: 'b-amber', color: colors.secondary, left: '72%', top: '40%', delayMs: 400, scale: 0.78 },
  { id: 'b-rose', color: colors.rose, left: '88%', top: '66%', delayMs: 800, scale: 0.7 },
];

const CONFETTI: readonly { left: DimensionValue; top: DimensionValue; color: string; size: number }[] = [
  { left: '36%', top: '10%', color: colors.butter, size: 6 },
  { left: '94%', top: '36%', color: colors.sage, size: 5 },
  { left: '62%', top: '22%', color: colors.rose, size: 5 },
  { left: '80%', top: '90%', color: colors.secondary, size: 5 },
  { left: '26%', top: '6%', color: colors.accent, size: 4 },
];

function useReduceMotion(): boolean {
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReduceMotion(enabled);
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);
  return reduceMotion;
}

function FloatingSticker({ seed, still }: { seed: StickerSeed; still: boolean }) {
  const enter = useSharedValue(still ? 1 : 0);
  const bob = useSharedValue(0);
  const Icon = seed.icon;

  useEffect(() => {
    if (still) return;
    enter.value = withDelay(seed.delayMs, withSpring(1, { damping: 9, stiffness: 140 }));
    bob.value = withDelay(
      seed.delayMs,
      withRepeat(
        withTiming(1, { duration: 2600 + seed.delayMs, easing: Easing.inOut(Easing.sin) }),
        -1,
        true,
      ),
    );
  }, [bob, enter, seed.delayMs, still]);

  const style = useAnimatedStyle(() => ({
    opacity: enter.value,
    transform: [
      { translateY: (bob.value - 0.5) * 10 },
      { rotate: `${(bob.value - 0.5) * 14}deg` },
      { scale: enter.value },
    ],
  }));

  const chip = seed.size + 18;
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.sticker,
        {
          left: seed.left,
          top: seed.top,
          width: chip,
          height: chip,
          borderRadius: chip / 2,
          borderColor: seed.color,
        },
        style,
      ]}
    >
      <Icon
        size={seed.size}
        color={seed.color}
        fill={seed.fill ? seed.color : 'transparent'}
        strokeWidth={2.2}
        absoluteStrokeWidth
      />
    </Animated.View>
  );
}

function BalloonShape({ color }: { color: string }) {
  return (
    <Svg width={36} height={64} viewBox="0 0 36 64">
      <Ellipse cx={18} cy={18} rx={15} ry={18} fill={color} />
      <Ellipse cx={12} cy={11} rx={4} ry={6} fill={colors.white} opacity={0.35} />
      <Path d="M15 35 L21 35 L18 40 Z" fill={color} />
      <Path
        d="M18 40 C 14 47, 22 52, 17 63"
        stroke={colors.neutral}
        strokeWidth={1.2}
        fill="none"
        opacity={0.6}
      />
    </Svg>
  );
}

/** Tap to pop — a small reward loop; it floats back after a moment. */
function PoppableBalloon({ seed, still }: { seed: BalloonSeed; still: boolean }) {
  const drift = useSharedValue(0);
  const pop = useSharedValue(1);
  const [popped, setPopped] = useState(false);

  useEffect(() => {
    if (still) return;
    drift.value = withDelay(
      seed.delayMs,
      withRepeat(
        withTiming(1, { duration: 3400 + seed.delayMs, easing: Easing.inOut(Easing.sin) }),
        -1,
        true,
      ),
    );
  }, [drift, seed.delayMs, still]);

  useEffect(() => {
    if (!popped) return;
    const timer = setTimeout(() => {
      pop.value = withSpring(1, { damping: 10, stiffness: 120 });
      setPopped(false);
    }, 2200);
    return () => clearTimeout(timer);
  }, [pop, popped]);

  const style = useAnimatedStyle(() => ({
    opacity: pop.value,
    transform: [
      { translateY: (drift.value - 0.5) * -14 },
      { translateX: (drift.value - 0.5) * 6 },
      { scale: seed.scale * (0.4 + pop.value * 0.6) },
    ],
  }));

  const handlePop = () => {
    if (popped) return;
    triggerTabHaptic();
    pop.value = withSequence(
      withTiming(1.25, { duration: 90 }),
      withTiming(0, { duration: 160 }),
    );
    setPopped(true);
  };

  return (
    <Animated.View style={[styles.balloon, { left: seed.left, top: seed.top }, style]}>
      <Pressable
        onPress={handlePop}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel="Pop balloon"
      >
        <BalloonShape color={seed.color} />
      </Pressable>
    </Animated.View>
  );
}

/** Create home first fold — warm, playful stage with the emotional hook. */
export function HomeHeroStage({ greeting, headline, line }: Props) {
  const still = useReduceMotion();
  const rise = useSharedValue(still ? 1 : 0);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (still) return;
    rise.value = withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) });
  }, [rise, still]);

  const copyStyle = useAnimatedStyle(() => ({
    opacity: rise.value,
    transform: [{ translateY: (1 - rise.value) * 12 }],
  }));

  return (
    <View style={styles.shadowShell}>
      <View
        style={styles.stage}
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          if (width !== size.width || height !== size.height) setSize({ width, height });
        }}
      >
        {/* Sized in pixels: percentage + viewBox under-fills on Android. */}
        {size.width > 0 ? (
          <Svg style={StyleSheet.absoluteFill} width={size.width} height={size.height}>
            <Defs>
              <RadialGradient id="heroCoral" cx="92%" cy="8%" rx="70%" ry="80%">
                <Stop offset="0%" stopColor={colors.accent} stopOpacity={0.3} />
                <Stop offset="100%" stopColor={colors.accent} stopOpacity={0} />
              </RadialGradient>
              <RadialGradient id="heroAmber" cx="8%" cy="100%" rx="65%" ry="75%">
                <Stop offset="0%" stopColor={colors.secondary} stopOpacity={0.3} />
                <Stop offset="100%" stopColor={colors.secondary} stopOpacity={0} />
              </RadialGradient>
              <RadialGradient id="heroRose" cx="75%" cy="100%" rx="45%" ry="55%">
                <Stop offset="0%" stopColor={colors.rose} stopOpacity={0.22} />
                <Stop offset="100%" stopColor={colors.rose} stopOpacity={0} />
              </RadialGradient>
              <LinearGradient id="heroGloss" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor={colors.white} stopOpacity={0.55} />
                <Stop offset="100%" stopColor={colors.white} stopOpacity={0} />
              </LinearGradient>
            </Defs>
            <Rect x={0} y={0} width={size.width} height={size.height} fill="url(#heroCoral)" />
            <Rect x={0} y={0} width={size.width} height={size.height} fill="url(#heroAmber)" />
            <Rect x={0} y={0} width={size.width} height={size.height} fill="url(#heroRose)" />
            <Rect x={0} y={0} width={size.width} height={size.height * 0.45} fill="url(#heroGloss)" />
          </Svg>
        ) : null}

        {CONFETTI.map((dot, i) => (
          <View
            key={`c-${i}`}
            pointerEvents="none"
            style={[
              styles.confetti,
              {
                left: dot.left,
                top: dot.top,
                width: dot.size,
                height: dot.size,
                borderRadius: dot.size / 2,
                backgroundColor: dot.color,
              },
            ]}
          />
        ))}

        {BALLOONS.map((seed) => (
          <PoppableBalloon key={seed.id} seed={seed} still={still} />
        ))}
        {STICKERS.map((seed) => (
          <FloatingSticker key={seed.id} seed={seed} still={still} />
        ))}

        <Animated.View style={[styles.copy, copyStyle]} accessibilityRole="header">
          <View style={styles.greetingChip}>
            <Text style={styles.greeting}>{greeting}</Text>
          </View>
          <Text style={styles.headline}>{headline}</Text>
          <Text style={styles.line}>{line}</Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadowShell: {
    marginTop: spacing.sm,
    borderRadius: radius.xl,
    ...shadow.card,
    shadowColor: colors.accent,
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 4,
  },
  stage: {
    minHeight: 208,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.accentSoft,
    borderTopColor: colors.white,
    backgroundColor: colors.amberSoft,
    overflow: 'hidden',
    padding: spacing.lg,
    justifyContent: 'flex-end',
  },
  copy: {
    maxWidth: '60%',
    gap: spacing.xs,
    zIndex: 2,
  },
  greetingChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    marginBottom: spacing.xs,
  },
  greeting: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightSemibold,
    color: colors.accent,
    letterSpacing: 0.2,
  },
  headline: {
    fontSize: 26,
    lineHeight: 26 * 1.15,
    fontWeight: typography.weightSemibold,
    letterSpacing: -0.4,
    color: colors.ink,
  },
  line: {
    fontSize: typography.sizeSm,
    lineHeight: typography.sizeSm * 1.45,
    color: colors.inkSoft,
  },
  sticker: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 2,
    zIndex: 1,
    ...shadow.card,
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  balloon: {
    position: 'absolute',
    zIndex: 1,
  },
  confetti: {
    position: 'absolute',
    opacity: 0.8,
  },
});
