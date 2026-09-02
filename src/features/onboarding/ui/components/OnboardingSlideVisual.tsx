import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInLeft,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Text } from '../../../../shared/ui/Text';
import { CardWashBackground } from '../../../../shared/ui/CardWashBackground';
import { colors, radius, shadow, spacing, typography } from '../../../../shared/theme/tokens';
import type { OnboardingSlideId } from '../../domain/onboardingSlides';

type Props = {
  slideId: OnboardingSlideId;
  isActive: boolean;
  replayKey: number;
  onReplay?: () => void;
};

const SPRING = { damping: 16, stiffness: 180, mass: 0.85 };

function MockCardShell({
  children,
  washPrimary,
  washSecondary,
  replayKey,
}: {
  children: ReactNode;
  washPrimary: string;
  washSecondary: string;
  replayKey: number;
}) {
  return (
    <Animated.View
      key={`shell-${replayKey}`}
      entering={ZoomIn.springify().damping(18).stiffness(160).delay(40)}
      style={styles.shadowShell}
    >
      <View style={styles.frame}>
        <CardWashBackground variant="milestone" primary={washPrimary} secondary={washSecondary} />
        {children}
      </View>
    </Animated.View>
  );
}

function CreateSlideVisual({ isActive, replayKey }: { isActive: boolean; replayKey: number }) {
  const photoFill = useSharedValue(0);
  const lineOne = useSharedValue(0);
  const lineTwo = useSharedValue(0);
  const chipPulse = useSharedValue(1);

  useEffect(() => {
    if (!isActive) {
      photoFill.value = 0;
      lineOne.value = 0;
      lineTwo.value = 0;
      chipPulse.value = 1;
      return;
    }

    photoFill.value = withDelay(520, withTiming(1, { duration: 680, easing: Easing.out(Easing.cubic) }));
    lineOne.value = withDelay(900, withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) }));
    lineTwo.value = withDelay(1080, withTiming(1, { duration: 380, easing: Easing.out(Easing.cubic) }));
    chipPulse.value = withDelay(
      280,
      withSequence(
        withSpring(1.04, SPRING),
        withSpring(1, SPRING),
      ),
    );
  }, [chipPulse, isActive, lineOne, lineTwo, photoFill, replayKey]);

  const photoStyle = useAnimatedStyle(() => ({
    opacity: 0.35 + photoFill.value * 0.65,
    transform: [{ scale: 0.96 + photoFill.value * 0.04 }],
    borderColor: photoFill.value > 0.5 ? colors.accent : colors.border,
    borderStyle: photoFill.value > 0.7 ? 'solid' : 'dashed',
  }));

  const lineOneStyle = useAnimatedStyle(() => ({
    width: `${24 + lineOne.value * 76}%`,
    opacity: 0.25 + lineOne.value * 0.35,
  }));

  const lineTwoStyle = useAnimatedStyle(() => ({
    width: `${16 + lineTwo.value * 52}%`,
    opacity: 0.2 + lineTwo.value * 0.35,
  }));

  const chipStyle = useAnimatedStyle(() => ({
    transform: [{ scale: chipPulse.value }],
  }));

  return (
    <MockCardShell
      replayKey={replayKey}
      washPrimary={colors.accentSoft}
      washSecondary={colors.secondary}
    >
      <View style={styles.chipRow}>
        {['Birthday', 'Anniversary', 'Thank you'].map((label, index) => {
          const selected = label === 'Birthday';
          return (
            <Animated.View
              key={label}
              entering={FadeInDown.duration(360).delay(120 + index * 70)}
            >
              {selected ? (
                <Animated.View style={chipStyle}>
                  <View style={[styles.chip, styles.chipSelected]}>
                    <Text style={[styles.chipLabel, styles.chipLabelSelected]}>
                      {label}
                    </Text>
                  </View>
                </Animated.View>
              ) : (
                <View style={styles.chip}>
                  <Text style={styles.chipLabel}>{label}</Text>
                </View>
              )}
            </Animated.View>
          );
        })}
      </View>
      <Animated.View style={[styles.photoSlot, photoStyle]}>
        <Text style={styles.photoHint}>
          {isActive ? 'A moment together' : 'Add a photo'}
        </Text>
      </Animated.View>
      <Animated.View style={[styles.messageLine, lineOneStyle]} />
      <Animated.View style={[styles.messageLine, lineTwoStyle]} />
    </MockCardShell>
  );
}

function ShareSlideVisual({ isActive, replayKey }: { isActive: boolean; replayKey: number }) {
  const floatY = useSharedValue(0);
  const glow = useSharedValue(0);

  useEffect(() => {
    if (!isActive) {
      floatY.value = 0;
      glow.value = 0;
      return;
    }

    floatY.value = withRepeat(
      withSequence(
        withTiming(-5, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
        withTiming(5, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
    glow.value = withDelay(
      900,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.35, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      ),
    );
  }, [floatY, glow, isActive, replayKey]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  const messageGlowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
  }));

  return (
    <View style={styles.shareOffset}>
      <Animated.View
        key={`share-${replayKey}`}
        entering={FadeInLeft.springify().damping(17).stiffness(150).delay(60)}
        style={[styles.shadowShell, cardStyle]}
      >
        <View style={styles.wishCard}>
          <CardWashBackground variant="birthday" primary={colors.accentSoft} secondary={colors.secondary} />
          <Animated.View entering={FadeIn.duration(400).delay(200)}>
            <Text style={styles.wishEyebrow}>For Alex</Text>
          </Animated.View>
          <View style={styles.messageWrap}>
            <Animated.View style={[styles.messageGlow, messageGlowStyle]} />
            <Animated.View entering={FadeInDown.duration(520).delay(340)}>
              <Text style={styles.wishMessage}>
                Wishing you a day as warm as you are.
              </Text>
            </Animated.View>
          </View>
          <Animated.View
            entering={ZoomIn.duration(480).delay(520)}
            style={styles.wishPhoto}
          />
          <Animated.View entering={FadeInDown.duration(380).delay(720)} style={styles.sentPill}>
            <Text style={styles.sentPillLabel}>Private link ready</Text>
          </Animated.View>
        </View>
      </Animated.View>
    </View>
  );
}

function RememberSlideVisual({ replayKey }: { isActive: boolean; replayKey: number }) {
  const people = [
    { name: 'Alex', occasion: 'Birthday · Mar 12' },
    { name: 'Sam', occasion: 'Anniversary · Jun 3' },
  ];

  return (
    <MockCardShell
      replayKey={replayKey}
      washPrimary={colors.sidebar}
      washSecondary={colors.accentSoft}
    >
      {people.map((person, index) => (
        <Animated.View
          key={person.name}
          entering={FadeInLeft.duration(440).delay(180 + index * 160).springify().damping(18)}
          style={[styles.vaultRow, index === people.length - 1 && styles.vaultRowLast]}
        >
          <View style={styles.vaultAvatar}>
            <Text style={styles.vaultInitial}>{person.name[0]}</Text>
          </View>
          <View style={styles.vaultCopy}>
            <Text style={styles.vaultName}>{person.name}</Text>
            <Text style={styles.vaultMeta}>{person.occasion}</Text>
          </View>
          {index === 0 ? (
            <View style={styles.rememberBadge}>
              <Text style={styles.rememberBadgeLabel}>Saved</Text>
            </View>
          ) : null}
        </Animated.View>
      ))}
    </MockCardShell>
  );
}

export function OnboardingSlideVisual({ slideId, isActive, replayKey, onReplay }: Props) {
  const [hintVisible, setHintVisible] = useState(false);

  useEffect(() => {
    if (!isActive) {
      setHintVisible(false);
      return;
    }
    const timer = setTimeout(() => setHintVisible(true), 1400);
    return () => clearTimeout(timer);
  }, [isActive, replayKey]);

  const visual =
    slideId === 'create' ? (
      <CreateSlideVisual isActive={isActive} replayKey={replayKey} />
    ) : slideId === 'share' ? (
      <ShareSlideVisual isActive={isActive} replayKey={replayKey} />
    ) : (
      <RememberSlideVisual isActive={isActive} replayKey={replayKey} />
    );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Replay slide animation"
      accessibilityHint="Tap to replay the illustration animation"
      onPress={onReplay}
      style={styles.pressable}
    >
      {visual}
      {hintVisible && isActive ? (
        <Animated.View entering={FadeIn.duration(320)} style={styles.replayHint}>
          <Text style={styles.replayHintLabel}>Tap to replay</Text>
        </Animated.View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    width: '100%',
    alignItems: 'center',
  },
  shadowShell: {
    width: '100%',
    maxWidth: 320,
    borderRadius: radius.lg,
    ...shadow.card,
    shadowOpacity: 0.12,
    elevation: 4,
  },
  frame: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    gap: spacing.md,
    overflow: 'hidden',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    zIndex: 1,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surface,
  },
  chipSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.sidebar,
  },
  chipLabel: {
    fontSize: typography.sizeSm,
    color: colors.muted,
  },
  chipLabelSelected: {
    color: colors.ink,
    fontWeight: typography.weightMedium,
  },
  photoSlot: {
    height: 132,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.sidebar,
    zIndex: 1,
  },
  photoHint: {
    fontSize: typography.sizeSm,
    color: colors.muted,
    fontWeight: typography.weightMedium,
  },
  messageLine: {
    height: 10,
    borderRadius: radius.sm,
    backgroundColor: colors.accent,
    zIndex: 1,
  },
  shareOffset: {
    width: '100%',
    maxWidth: 320,
    paddingLeft: spacing.lg,
  },
  wishCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    gap: spacing.sm,
    overflow: 'hidden',
  },
  wishEyebrow: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightMedium,
    color: colors.ink,
    zIndex: 1,
  },
  messageWrap: {
    position: 'relative',
    zIndex: 1,
  },
  messageGlow: {
    ...StyleSheet.absoluteFill,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
    transform: [{ scale: 1.08 }],
  },
  wishMessage: {
    fontSize: typography.sizeMd,
    lineHeight: typography.sizeMd * 1.4,
    color: colors.inkSoft,
    fontStyle: 'italic',
  },
  wishPhoto: {
    marginTop: spacing.sm,
    height: 112,
    borderRadius: radius.md,
    backgroundColor: colors.sidebar,
    borderWidth: 1,
    borderColor: colors.border,
    zIndex: 1,
  },
  sentPill: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.sidebar,
    borderWidth: 1,
    borderColor: colors.border,
    zIndex: 1,
  },
  sentPillLabel: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightSemibold,
    color: colors.accent,
    letterSpacing: 0.2,
  },
  vaultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    zIndex: 1,
  },
  vaultRowLast: {
    borderBottomWidth: 0,
  },
  vaultAvatar: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.sidebar,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vaultInitial: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightSemibold,
    color: colors.accent,
  },
  vaultCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  vaultName: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightMedium,
    color: colors.ink,
  },
  vaultMeta: {
    fontSize: typography.sizeSm,
    color: colors.muted,
  },
  rememberBadge: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.accentSoft,
  },
  rememberBadgeLabel: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightSemibold,
    color: colors.accent,
  },
  replayHint: {
    marginTop: spacing.sm,
  },
  replayHintLabel: {
    fontSize: typography.sizeXs,
    color: colors.muted,
    textAlign: 'center',
  },
});
