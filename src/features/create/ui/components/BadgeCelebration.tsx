import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { triggerSuccessHaptic } from '../../../../shared/platform/haptics';
import { Lock } from '../../../../shared/ui/icons/lucide';
import { Button } from '../../../../shared/ui/Button';
import { Pip } from '../../../../shared/ui/Pip';
import { Text } from '../../../../shared/ui/Text';
import { colors, overlay, radius, shadow, spacing, typography } from '../../../../shared/theme/tokens';
import {
  BADGE_DESCRIPTIONS,
  badgeNextStep,
  badgePipLine,
  badgePipMood,
  type WishBadge,
} from '../../domain/wishJourney';
import { BADGE_STYLE } from './badgeStyle';

type Props = {
  badge: WishBadge | null;
  /** First name of the person who got their first wish: Pip mentions them for the first badge. */
  firstName?: string | null;
  /** The badge to aim for after this one. */
  next?: WishBadge | null;
  /** The main button: carry on and make a wish. */
  onCreate: () => void;
  /** The main button when the next thing to do is in the Vault. */
  onVault: () => void;
  onDismiss: () => void;
};

const NEXT_STEP_LABEL = {
  create: 'Make another wish',
  vault: 'Save another person',
} as const;

const CONFETTI_COLORS = [
  colors.accent,
  colors.secondary,
  colors.rose,
  colors.butter,
  colors.sage,
] as const;

/** Evenly spread burst; distance/size vary so it doesn't look like a ring. */
const PIECES = Array.from({ length: 18 }, (_, i) => {
  const angle = (i / 18) * Math.PI * 2;
  const distance = 88 + (i % 3) * 26;
  return {
    x: Math.cos(angle) * distance,
    y: Math.sin(angle) * distance,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length]!,
    size: 6 + (i % 3) * 2,
    square: i % 2 === 0,
  };
});

function ConfettiPiece({
  piece,
  burst,
}: {
  piece: (typeof PIECES)[number];
  burst: SharedValue<number>;
}) {
  const style = useAnimatedStyle(() => ({
    opacity: burst.value < 0.85 ? 1 : (1 - burst.value) / 0.15,
    transform: [
      { translateX: piece.x * burst.value },
      // Slight fall under "gravity" once it's out.
      { translateY: piece.y * burst.value + burst.value * burst.value * 30 },
      { rotate: `${burst.value * 260}deg` },
    ],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.piece,
        {
          width: piece.size,
          height: piece.square ? piece.size : piece.size * 1.8,
          borderRadius: piece.square ? 2 : piece.size,
          backgroundColor: piece.color,
        },
        style,
      ]}
    />
  );
}

/** One-time moment when a badge unlocks. */
const EXIT_MS = 220;
/** The reveal timeline runs 0 to this; each block fades in at its own point along it. */
const REVEAL_END = 1.5;
const SHEET_SPRING = { damping: 20, stiffness: 190, mass: 0.9 };
const MEDAL_SPRING = { damping: 13, stiffness: 170, mass: 0.8 };

/** Fades + lifts a block in once `reveal` passes its slot in the timeline. */
function useStaggerStyle(reveal: SharedValue<number>, start: number) {
  return useAnimatedStyle(() => {
    const t = interpolate(reveal.value, [start, start + 0.35], [0, 1], Extrapolation.CLAMP);
    return { opacity: t, transform: [{ translateY: (1 - t) * 10 }] };
  });
}

export function BadgeCelebration({ badge, firstName = null, next = null, onCreate, onVault, onDismiss }: Props) {
  const [reduceMotion, setReduceMotion] = useState(false);
  const [closing, setClosing] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const backdrop = useSharedValue(0);
  const sheet = useSharedValue(0);
  const medal = useSharedValue(0);
  const reveal = useSharedValue(0);
  const burst = useSharedValue(0);
  const glow = useSharedValue(0);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!badge) return;
    setClosing(false);
    triggerSuccessHaptic();
    if (reduceMotion) {
      backdrop.value = withTiming(1, { duration: 160 });
      sheet.value = withTiming(1, { duration: 160 });
      medal.value = 1;
      reveal.value = REVEAL_END;
      return;
    }
    backdrop.value = 0;
    sheet.value = 0;
    medal.value = 0;
    reveal.value = 0;
    burst.value = 0;

    backdrop.value = withTiming(1, { duration: 280, easing: Easing.out(Easing.cubic) });
    sheet.value = withSpring(1, SHEET_SPRING);
    medal.value = withDelay(140, withSpring(1, MEDAL_SPRING));
    burst.value = withDelay(
      220,
      withTiming(1, { duration: 1300, easing: Easing.out(Easing.cubic) }),
    );
    reveal.value = withDelay(
      200,
      withTiming(REVEAL_END, { duration: 1300, easing: Easing.out(Easing.cubic) }),
    );
    glow.value = withDelay(
      400,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
      ),
    );
  }, [backdrop, badge, burst, glow, medal, reduceMotion, reveal, sheet]);

  /** Fades out, records the badge as seen, then does `then` (go on to make a wish, for instance). */
  const close = (then?: () => void) => {
    if (closing) return;
    setClosing(true);
    const out = { duration: EXIT_MS, easing: Easing.in(Easing.cubic) };
    backdrop.value = withTiming(0, out);
    sheet.value = withTiming(0, out);
    closeTimer.current = setTimeout(() => {
      onDismiss();
      then?.();
    }, EXIT_MS);
  };

  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdrop.value }));
  const sheetStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, sheet.value * 1.5),
    transform: [
      { translateY: (1 - sheet.value) * 36 },
      { scale: 0.94 + sheet.value * 0.06 },
    ],
  }));
  const medalStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, medal.value * 2),
    transform: [
      { scale: 0.3 + medal.value * 0.7 },
      { rotate: `${(1 - medal.value) * -24}deg` },
    ],
  }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: (0.35 + glow.value * 0.35) * Math.min(1, medal.value),
    transform: [{ scale: 1 + glow.value * 0.12 }],
  }));
  const eyebrowStyle = useStaggerStyle(reveal, 0.15);
  const titleStyle = useStaggerStyle(reveal, 0.3);
  const bodyStyle = useStaggerStyle(reveal, 0.45);
  const pipStyle = useStaggerStyle(reveal, 0.6);
  const nextStyle = useStaggerStyle(reveal, 0.75);
  const ctaStyle = useStaggerStyle(reveal, 0.9);

  if (!badge) return null;

  const tone = BADGE_STYLE[badge.id];
  const Icon = tone.icon;
  const step = badgeNextStep(badge.id);

  return (
    <Modal
      transparent
      visible
      animationType="none"
      onRequestClose={() => close()}
      statusBarTranslucent
      accessibilityViewIsModal
    >
      <Animated.View style={[StyleSheet.absoluteFill, styles.scrim, backdropStyle]} />
      <Pressable style={styles.backdrop} onPress={() => close()} accessibilityLabel="Close">
        <Animated.View style={[styles.sheet, sheetStyle]}>
          {/* Swallow taps so tapping the sheet doesn't dismiss. */}
          <Pressable style={styles.sheetInner} onPress={() => undefined}>
            <View style={styles.medalStage}>
              {!reduceMotion
                ? PIECES.map((piece, i) => <ConfettiPiece key={i} piece={piece} burst={burst} />)
                : null}
              <Animated.View style={[styles.glow, { backgroundColor: tone.soft }, glowStyle]} />
              <Animated.View pointerEvents="none" style={[styles.pip, medalStyle]}>
                <Pip mood={badgePipMood(badge.id)} size={PIP_CHEER} bob={false} />
              </Animated.View>
              <Animated.View
                style={[
                  styles.medal,
                  { backgroundColor: tone.color, shadowColor: tone.color },
                  medalStyle,
                ]}
              >
                <View style={styles.medalShine} />
                <Icon
                  size={40}
                  color={colors.white}
                  fill={badge.id === 'first_wish' ? colors.white : 'transparent'}
                  strokeWidth={2}
                  absoluteStrokeWidth
                />
              </Animated.View>
            </View>

            <Animated.View style={eyebrowStyle}>
              <Text style={styles.eyebrow} accessibilityRole="header">
                Badge earned
              </Text>
            </Animated.View>
            <Animated.View style={titleStyle}>
              <Text style={styles.title}>{badge.label}</Text>
            </Animated.View>
            <Animated.View style={bodyStyle}>
              <Text style={styles.body}>{BADGE_DESCRIPTIONS[badge.id]}</Text>
            </Animated.View>

            {/* Pip says what it means, in his own words. */}
            <Animated.View style={[styles.bubble, pipStyle]}>
              <Text style={styles.bubbleName}>Pip</Text>
              <Text style={styles.bubbleLine}>{badgePipLine(badge.id, firstName)}</Text>
            </Animated.View>

            {next ? (
              <Animated.View style={[styles.next, nextStyle]}>
                <Lock size={14} color={colors.muted} strokeWidth={2} absoluteStrokeWidth />
                <Text style={styles.nextText}>
                  Next badge: {next.label}. {next.hint}
                </Text>
              </Animated.View>
            ) : null}

            <Animated.View style={[styles.cta, ctaStyle]}>
              <Button
                label={NEXT_STEP_LABEL[step]}
                onPress={() => close(step === 'vault' ? onVault : onCreate)}
                disabled={closing}
              />
              <Button label="Maybe later" variant="ghost" onPress={() => close()} disabled={closing} />
            </Animated.View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const MEDAL = 96;
const PIP_CHEER = 92;

const styles = StyleSheet.create({
  scrim: {
    backgroundColor: overlay.scrim,
  },
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  sheet: {
    width: '100%',
    maxWidth: 360,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    ...shadow.card,
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 8,
  },
  sheetInner: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  medalStage: {
    width: MEDAL * 2,
    height: MEDAL * 1.6,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  glow: {
    position: 'absolute',
    width: MEDAL + 40,
    height: MEDAL + 40,
    borderRadius: (MEDAL + 40) / 2,
  },
  medal: {
    width: MEDAL,
    height: MEDAL,
    borderRadius: MEDAL / 2,
    borderWidth: 4,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  medalShine: {
    position: 'absolute',
    top: 6,
    left: 14,
    right: 14,
    height: MEDAL * 0.36,
    borderRadius: MEDAL,
    backgroundColor: colors.white,
    opacity: 0.25,
  },
  piece: {
    position: 'absolute',
  },
  // Pip cheers from just behind the medal's lower right.
  pip: {
    position: 'absolute',
    right: -spacing.sm,
    bottom: -spacing.xs,
  },
  eyebrow: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightSemibold,
    color: colors.accent,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  title: {
    marginTop: spacing.xs,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
    textAlign: 'center',
  },
  body: {
    marginTop: spacing.xs,
    fontSize: typography.sizeSm,
    lineHeight: typography.sizeSm * 1.5,
    color: colors.inkSoft,
    textAlign: 'center',
  },
  bubble: {
    alignSelf: 'stretch',
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.sidebar,
    gap: 2,
  },
  bubbleName: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightSemibold,
    color: colors.accent,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  bubbleLine: {
    fontSize: typography.sizeSm,
    lineHeight: typography.sizeSm * 1.5,
    color: colors.ink,
  },
  next: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  nextText: {
    flex: 1,
    fontSize: typography.sizeXs,
    lineHeight: typography.sizeXs * 1.4,
    color: colors.muted,
  },
  cta: {
    alignSelf: 'stretch',
    marginTop: spacing.md,
    gap: spacing.xs,
  },
});
