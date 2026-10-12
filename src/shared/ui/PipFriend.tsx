import { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { PIP_SPOTS, pipLine, type PipSpot } from '../mascot/pipSpots';
import { triggerTabHaptic } from '../platform/haptics';
import { colors, radius, spacing, typography } from '../theme/tokens';
import { Pip } from './Pip';
import { Text } from './Text';

type Props = {
  spot: PipSpot;
  /** Pip's width in px. */
  size?: number;
  /**
   * `hero`: Pip on his own, centred; a line pops up above him when he is tapped.
   * `inline`: Pip beside a speech bubble that is always there; tapping cycles the line.
   */
  variant?: 'hero' | 'inline';
  /** Fills `{name}` in his lines. */
  name?: string;
};

/** How long he stays happy after a tap, and how long a hero line stays up. */
const EXCITED_MS = 1300;
const LINE_MS = 3600;
const PIP_BLINKS = 3;
const SQUASH_MS = 110;
const SQUASH_SPRING = { damping: 7, stiffness: 240, mass: 0.7 };

function useReduceMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReduce(enabled);
    });
    return () => {
      mounted = false;
    };
  }, []);
  return reduce;
}

/**
 * Pip as a character rather than a picture: he blinks while he waits, and when
 * tapped he squashes, bounces, smiles and says the next thing for this spot.
 * Every motion is finite, so nothing keeps the screen busy.
 */
export function PipFriend({ spot, size = 120, variant = 'hero', name }: Props) {
  const config = PIP_SPOTS[spot];
  const reduceMotion = useReduceMotion();
  const squash = useSharedValue(0);
  const [taps, setTaps] = useState(0);
  const [excited, setExcited] = useState(false);
  const [lineUp, setLineUp] = useState(variant === 'inline');
  const excitedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lineTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (excitedTimer.current) clearTimeout(excitedTimer.current);
      if (lineTimer.current) clearTimeout(lineTimer.current);
    },
    [],
  );

  const onPress = useCallback(() => {
    triggerTabHaptic();
    setTaps((count) => count + 1);
    setExcited(true);
    setLineUp(true);

    if (excitedTimer.current) clearTimeout(excitedTimer.current);
    excitedTimer.current = setTimeout(() => setExcited(false), EXCITED_MS);

    if (variant === 'hero') {
      if (lineTimer.current) clearTimeout(lineTimer.current);
      lineTimer.current = setTimeout(() => setLineUp(false), LINE_MS);
    }

    if (!reduceMotion) {
      squash.value = withSequence(
        withTiming(1, { duration: SQUASH_MS }),
        withSpring(0, SQUASH_SPRING),
      );
    }
  }, [reduceMotion, squash, variant]);

  const bodyStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: squash.value * 8 },
      { scaleY: 1 - squash.value * 0.1 },
      { scaleX: 1 + squash.value * 0.07 },
    ],
  }));

  // Hero: nothing until the first tap, then line 0. Inline: line 0 straight away.
  const lineIndex = variant === 'hero' ? taps - 1 : taps;
  const line = pipLine(spot, lineIndex, name);
  const mood = excited ? config.tapMood : config.mood;

  const pip = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Pip"
      accessibilityHint="Tap to hear what Pip has to say"
      onPress={onPress}
      hitSlop={spacing.sm}
    >
      <Animated.View style={bodyStyle}>
        <Pip mood={mood} size={size} holdsGift={config.holdsGift} blinks={PIP_BLINKS} />
      </Animated.View>
    </Pressable>
  );

  if (variant === 'inline') {
    return (
      <View style={styles.inline}>
        {pip}
        <View style={styles.bubble}>
          <View style={styles.tailRail} pointerEvents="none">
            <View style={styles.tailSide} />
          </View>
          <Text style={styles.line} accessibilityLiveRegion="polite">
            {line}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.hero}>
      {taps > 0 && lineUp ? (
        <View style={styles.floatingLine} pointerEvents="none">
          <View style={styles.bubble}>
            <Text style={styles.line} accessibilityLiveRegion="polite">
              {line}
            </Text>
            <View style={styles.tailDown} />
          </View>
        </View>
      ) : null}
      {pip}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  // Sits above Pip's hat without pushing anything around when it appears.
  floatingLine: {
    position: 'absolute',
    bottom: '100%',
    left: -spacing.xl,
    right: -spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  bubble: {
    maxWidth: 260,
    flexShrink: 1,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  // A full-height rail, so the tail is centred without relying on percentages.
  tailRail: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: -7,
    justifyContent: 'center',
  },
  tailSide: {
    width: 14,
    height: 14,
    backgroundColor: colors.surface,
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    transform: [{ rotate: '45deg' }],
  },
  tailDown: {
    position: 'absolute',
    bottom: -7,
    alignSelf: 'center',
    width: 14,
    height: 14,
    backgroundColor: colors.surface,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    transform: [{ rotate: '45deg' }],
  },
  line: {
    fontSize: typography.sizeSm,
    lineHeight: typography.sizeSm * 1.4,
    fontWeight: typography.weightMedium,
    color: colors.ink,
    textAlign: 'center',
  },
});
