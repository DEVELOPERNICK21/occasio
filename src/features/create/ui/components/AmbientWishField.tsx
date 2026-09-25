import { useEffect, useMemo, useState } from 'react';
import {
  AccessibilityInfo,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { Gift, Heart, Sparkles, type LucideIcon } from 'lucide-react-native';
import { colors } from '../../../../shared/theme/tokens';

type Motif = 'heart' | 'gift' | 'wish';

type Seed = {
  id: string;
  motif: Motif;
  x: number;
  y: number;
  size: number;
  delayMs: number;
  durationMs: number;
  bob: number;
  opacity: number;
};

const ICONS: Record<Motif, LucideIcon> = {
  heart: Heart,
  gift: Gift,
  wish: Sparkles,
};

/**
 * Parked in cream margins + hero band so they read over the home screen
 * without covering card text.
 */
const LAYOUT: Array<
  Omit<Seed, 'id' | 'opacity' | 'delayMs' | 'durationMs' | 'bob'>
> = [
  { motif: 'heart', x: 0.86, y: 0.07, size: 26 },
  { motif: 'gift', x: 0.12, y: 0.06, size: 22 },
  { motif: 'wish', x: 0.72, y: 0.11, size: 20 },
  { motif: 'heart', x: 0.94, y: 0.28, size: 22 },
  { motif: 'wish', x: 0.05, y: 0.3, size: 18 },
  { motif: 'gift', x: 0.93, y: 0.52, size: 24 },
  { motif: 'heart', x: 0.06, y: 0.55, size: 20 },
  { motif: 'wish', x: 0.9, y: 0.74, size: 22 },
  { motif: 'gift', x: 0.08, y: 0.78, size: 20 },
  { motif: 'heart', x: 0.78, y: 0.18, size: 18 },
];

const TINTS = [colors.accent, colors.secondary, colors.primary, colors.accentHover] as const;

function buildSeeds(): Seed[] {
  return LAYOUT.map((slot, i) => ({
    ...slot,
    id: `wish-${i}`,
    delayMs: i * 280,
    durationMs: 3800 + (i % 4) * 500,
    bob: 8 + (i % 3) * 3,
    opacity: 0.42 + (i % 3) * 0.06,
  }));
}

function FloatingMotif({
  seed,
  height,
  width,
}: {
  seed: Seed;
  height: number;
  width: number;
}) {
  const progress = useSharedValue(0);
  const Icon = ICONS[seed.motif];
  const tint = TINTS[seed.id.length % TINTS.length] ?? colors.accent;
  const baseX = seed.x * width;
  const baseY = seed.y * height;

  useEffect(() => {
    progress.value = withDelay(
      seed.delayMs,
      withRepeat(
        withTiming(1, {
          duration: seed.durationMs,
          easing: Easing.inOut(Easing.sin),
        }),
        -1,
        true,
      ),
    );
  }, [progress, seed.delayMs, seed.durationMs]);

  const style = useAnimatedStyle(() => {
    const t = progress.value;
    const y = baseY + Math.sin(t * Math.PI * 2) * seed.bob;
    const x = baseX + Math.cos(t * Math.PI * 2) * (seed.bob * 0.4);
    return {
      position: 'absolute' as const,
      left: x,
      top: y,
      opacity: seed.opacity,
      transform: [
        { translateX: -seed.size / 2 },
        { translateY: -seed.size / 2 },
        { rotate: `${(t - 0.5) * 10}deg` },
      ],
    };
  });

  return (
    <Animated.View style={style} pointerEvents="none">
      <Icon
        size={seed.size}
        color={tint}
        strokeWidth={2}
        absoluteStrokeWidth
        fill={seed.motif === 'heart' ? tint : 'transparent'}
      />
    </Animated.View>
  );
}

/** Soft hearts / gifts / sparkles over Create home (overlay — visible on Android). */
export function AmbientWishField() {
  const { height, width } = useWindowDimensions();
  const [reduceMotion, setReduceMotion] = useState(false);
  const seeds = useMemo(() => buildSeeds(), []);

  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReduceMotion(enabled);
    });
    const sub = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion,
    );
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  return (
    <View
      style={styles.root}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      collapsable={false}
    >
      {seeds.map((seed) => {
        if (reduceMotion) {
          const Icon = ICONS[seed.motif];
          const tint = TINTS[seed.id.length % TINTS.length] ?? colors.accent;
          return (
            <View
              key={seed.id}
              collapsable={false}
              style={[
                styles.static,
                {
                  left: seed.x * width - seed.size / 2,
                  top: seed.y * height - seed.size / 2,
                  opacity: seed.opacity,
                },
              ]}
            >
              <Icon
                size={seed.size}
                color={tint}
                strokeWidth={2}
                absoluteStrokeWidth
                fill={seed.motif === 'heart' ? tint : 'transparent'}
              />
            </View>
          );
        }
        return (
          <FloatingMotif
            key={seed.id}
            seed={seed}
            height={height}
            width={width}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  static: {
    position: 'absolute',
  },
});
