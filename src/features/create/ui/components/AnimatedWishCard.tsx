import { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Text } from '../../../../shared/ui/Text';
import { templateLabel, wishGreeting } from '../../domain/templates';
import { getTemplateTheme } from '../../domain/templateTheme';
import { colors, radius, spacing, typography } from '../../../../shared/theme/tokens';
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

export function AnimatedWishCard({
  recipientName,
  message,
  templateType,
  photoUri,
  showReplay = false,
  compact = false,
}: Props) {
  const theme = useMemo(() => getTemplateTheme(templateType), [templateType]);
  const hasPhoto = Boolean(photoUri);
  const [replayKey, setReplayKey] = useState(0);
  const greeting = wishGreeting(templateType);
  const displayName = recipientName.trim() || 'Their name';

  const cardOpacity = useSharedValue(0);
  const cardOffset = useSharedValue(12);

  const runEntrance = useCallback(() => {
    cardOpacity.value = 0;
    cardOffset.value = 12;
    cardOpacity.value = withTiming(1, { duration: 480, easing: Easing.out(Easing.cubic) });
    cardOffset.value = withTiming(0, { duration: 520, easing: Easing.out(Easing.cubic) });
  }, [cardOffset, cardOpacity]);

  useEffect(() => {
    runEntrance();
  }, [replayKey, runEntrance]);

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardOffset.value }],
  }));

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <Animated.View
        key={replayKey}
        style={[
          styles.card,
          compact && styles.cardCompact,
          cardAnimatedStyle,
        ]}
      >
        {hasPhoto && photoUri ? (
          <View style={styles.hero}>
            <Image source={{ uri: photoUri }} style={styles.heroImage} resizeMode="cover" />
          </View>
        ) : (
          <View style={[styles.heroPlain, { backgroundColor: theme.softBackground }]}>
            <View style={[styles.heroAccent, { backgroundColor: theme.accent }]} />
          </View>
        )}

        <View style={[styles.body, !hasPhoto && { backgroundColor: theme.softBackground }]}>
          <Animated.View entering={FadeInDown.delay(120).duration(420)}>
            <Text style={[styles.occasion, { color: theme.accent }]}>
              {templateLabel(templateType)}
            </Text>
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(200).duration(420)}>
            <Text style={[styles.greeting, { color: theme.accent }]}>{greeting}</Text>
            <Text
              style={[
                styles.name,
                compact && styles.nameCompact,
                { color: theme.accentSecondary },
              ]}
            >
              {displayName}
            </Text>
          </Animated.View>
          {message ? (
            <Animated.View entering={FadeInDown.delay(280).duration(420)}>
              <Text style={styles.message}>{message}</Text>
            </Animated.View>
          ) : (
            <Animated.View entering={FadeInDown.delay(280).duration(420)}>
              <Text style={styles.placeholder}>Your message will appear here.</Text>
            </Animated.View>
          )}
        </View>
      </Animated.View>

      {showReplay ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Replay card animation"
          onPress={() => setReplayKey((k) => k + 1)}
          style={styles.replayBtn}
        >
          <Text style={[styles.replayLabel, { color: theme.accent }]}>Replay animation</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    alignItems: 'center',
  },
  wrapCompact: {
    marginTop: spacing.sm,
  },
  card: {
    width: '100%',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  cardCompact: {
    maxWidth: 280,
  },
  hero: {
    aspectRatio: 5 / 4,
    overflow: 'hidden',
    backgroundColor: colors.sidebar,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroPlain: {
    height: 4,
  },
  heroAccent: {
    height: '100%',
    width: '100%',
  },
  body: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  occasion: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightSemibold,
    letterSpacing: 0.4,
  },
  greeting: {
    marginTop: spacing.sm,
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
    textAlign: 'center',
    lineHeight: typography.sizeMd * 1.2,
  },
  name: {
    marginTop: spacing.xs,
    fontSize: typography.sizeXl,
    fontWeight: typography.weightSemibold,
    textAlign: 'center',
    lineHeight: typography.sizeXl * 1.1,
  },
  nameCompact: {
    fontSize: typography.sizeLg,
    lineHeight: typography.sizeLg * 1.1,
  },
  message: {
    marginTop: spacing.md,
    fontSize: typography.sizeSm,
    fontStyle: 'italic',
    color: colors.inkSoft,
    textAlign: 'center',
    lineHeight: typography.sizeSm * 1.5,
  },
  placeholder: {
    marginTop: spacing.md,
    fontSize: typography.sizeSm,
    fontStyle: 'italic',
    color: colors.muted,
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
    fontWeight: typography.weightMedium,
  },
});
