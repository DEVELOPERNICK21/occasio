import { useCallback, useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Text } from '../../../../shared/ui/Text';
import { TEMPLATE_OPTIONS } from '../../domain/templates';
import { colors, radius, shadow, spacing, typography } from '../../../../shared/theme/tokens';
import type { TemplateType } from '../../domain/types';

type Props = {
  recipientName: string;
  message: string;
  templateType: TemplateType | null;
  photoUri?: string;
  /** Show tap-to-replay control (Preview screen). */
  showReplay?: boolean;
  /** Smaller card for Share success. */
  compact?: boolean;
};

function templateLabel(templateType: TemplateType): string {
  return TEMPLATE_OPTIONS.find((t) => t.id === templateType)?.label ?? 'Special wish';
}

export function AnimatedWishCard({
  recipientName,
  message,
  templateType,
  photoUri,
  showReplay = false,
  compact = false,
}: Props) {
  const hasPhoto = Boolean(photoUri);
  const [replayKey, setReplayKey] = useState(0);

  const cardScale = useSharedValue(0.94);
  const cardOpacity = useSharedValue(0);
  const photoScale = useSharedValue(1);
  const orbOffset = useSharedValue(0);

  const runEntrance = useCallback(() => {
    cardOpacity.value = 0;
    cardScale.value = 0.94;
    cardOpacity.value = withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) });
    cardScale.value = withTiming(1, { duration: 620, easing: Easing.out(Easing.cubic) });
  }, [cardOpacity, cardScale]);

  useEffect(() => {
    runEntrance();
    photoScale.value = withRepeat(
      withSequence(
        withTiming(1.07, { duration: 9000, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 9000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
    orbOffset.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 4200, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 4200, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, [replayKey, runEntrance, photoScale, orbOffset]);

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ scale: cardScale.value }],
  }));

  const photoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: photoScale.value }],
  }));

  const orbAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: orbOffset.value }],
  }));

  const displayName = recipientName.trim() || 'Their name';

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <Animated.View style={[styles.orbA, orbAnimatedStyle]} />
      <Animated.View style={[styles.orbB, orbAnimatedStyle]} />

      <Animated.View style={[styles.card, compact && styles.cardCompact, cardAnimatedStyle]}>
        <View style={[styles.mediaArea, compact && styles.mediaAreaCompact]}>
          {hasPhoto ? (
            <Animated.Image
              source={{ uri: photoUri }}
              style={[styles.hero, photoAnimatedStyle]}
              resizeMode="cover"
            />
          ) : null}
          <View style={[styles.scrim, hasPhoto && styles.scrimPhoto]} />
          <View style={[styles.content, hasPhoto ? styles.contentOnPhoto : styles.contentPlain]}>
            {templateType ? (
              <Animated.View entering={FadeInDown.delay(180).duration(480)}>
                <View style={styles.badgeRow}>
                  <View style={styles.badgeDot} />
                  <Text style={[styles.badge, hasPhoto && styles.badgeOnPhoto]}>
                    {templateLabel(templateType)}
                  </Text>
                </View>
              </Animated.View>
            ) : null}
            <Animated.View entering={FadeInDown.delay(320).duration(520)}>
              <Text
                style={[
                  styles.recipient,
                  compact && styles.recipientCompact,
                  hasPhoto && styles.recipientOnPhoto,
                ]}
              >
                {displayName}
              </Text>
            </Animated.View>
            {message ? (
              <Animated.View entering={FadeInDown.delay(460).duration(520)}>
                <Text style={[styles.message, hasPhoto && styles.messageOnPhoto]}>
                  {message}
                </Text>
              </Animated.View>
            ) : !hasPhoto ? (
              <Animated.View entering={FadeInDown.delay(460).duration(520)}>
                <Text style={styles.placeholder}>Your message will appear here.</Text>
              </Animated.View>
            ) : null}
          </View>
        </View>
      </Animated.View>

      {showReplay ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Replay card animation"
          onPress={() => setReplayKey((k) => k + 1)}
          style={styles.replayBtn}
        >
          <Text style={styles.replayLabel}>Tap to replay</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    alignItems: 'center',
    position: 'relative',
  },
  wrapCompact: {
    marginTop: spacing.sm,
  },
  orbA: {
    position: 'absolute',
    top: -12,
    right: spacing.lg,
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.tertiary,
    opacity: 0.45,
  },
  orbB: {
    position: 'absolute',
    bottom: 24,
    left: spacing.md,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.secondary,
    opacity: 0.28,
  },
  card: {
    width: '100%',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    ...shadow.card,
  },
  cardCompact: {
    maxWidth: 280,
  },
  mediaArea: {
    aspectRatio: 3 / 4,
    backgroundColor: colors.accentSoft,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  mediaAreaCompact: {
    aspectRatio: 4 / 5,
  },
  hero: {
    ...StyleSheet.absoluteFill,
  },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'transparent',
  },
  scrimPhoto: {
    backgroundColor: 'rgba(42, 34, 32, 0.12)',
  },
  content: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  contentOnPhoto: {
    backgroundColor: 'rgba(42, 34, 32, 0.55)',
  },
  contentPlain: {
    backgroundColor: 'transparent',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.secondary,
  },
  badge: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightSemibold,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  badgeOnPhoto: {
    color: 'rgba(255,255,255,0.85)',
  },
  recipient: {
    marginTop: spacing.sm,
    fontSize: typography.size2xl,
    fontFamily: typography.fontDisplay,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
    textAlign: 'center',
    lineHeight: typography.size2xl * 1.1,
  },
  recipientCompact: {
    fontSize: typography.sizeXl,
    lineHeight: typography.sizeXl * 1.1,
  },
  recipientOnPhoto: {
    color: colors.surface,
  },
  message: {
    marginTop: spacing.md,
    fontSize: typography.sizeMd,
    color: colors.inkSoft,
    textAlign: 'center',
    lineHeight: typography.sizeMd * 1.45,
  },
  messageOnPhoto: {
    color: 'rgba(255,255,255,0.92)',
  },
  placeholder: {
    marginTop: spacing.md,
    fontSize: typography.sizeSm,
    color: colors.muted,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  replayBtn: {
    marginTop: spacing.md,
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  replayLabel: {
    fontSize: typography.sizeSm,
    color: colors.accent,
    fontWeight: typography.weightMedium,
  },
});
