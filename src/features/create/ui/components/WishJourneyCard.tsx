import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { ChevronRight, Flame, Lock, Trophy } from '../../../../shared/ui/icons/lucide';
import { Text } from '../../../../shared/ui/Text';
import { colors, radius, shadow, spacing, typography } from '../../../../shared/theme/tokens';
import type { WishJourney } from '../../domain/wishJourney';
import { BadgeMedal } from './BadgeMedal';

type Props = {
  journey: WishJourney;
  /** Opens the screen with every badge and how to earn it. */
  onSeeAll?: () => void;
};

/** Level, streak, the badges, and the one to aim for next: real History/Vault counts only. */
export function WishJourneyCard({ journey, onSeeAll }: Props) {
  const fill = useSharedValue(0);

  useEffect(() => {
    fill.value = withDelay(
      200,
      withTiming(journey.progress, { duration: 900, easing: Easing.out(Easing.cubic) }),
    );
  }, [fill, journey.progress]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${Math.max(4, fill.value * 100)}%`,
  }));

  const earned = journey.badges.filter((b) => b.unlocked).length;
  const next = journey.nextBadge;

  return (
    <View style={styles.shadowShell}>
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.levelTile}>
            <Trophy size={20} color={colors.white} strokeWidth={2.2} absoluteStrokeWidth />
          </View>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>Your wish journey</Text>
            <Text style={styles.levelTitle} numberOfLines={1}>
              Level {journey.level.level} · {journey.level.title}
            </Text>
          </View>
          {journey.streakMonths > 0 ? (
            <View
              style={[styles.streakChip, journey.streakAtRisk && styles.streakChipRisk]}
              accessibilityLabel={`${journey.streakMonths} month streak`}
            >
              <Flame
                size={14}
                color={colors.accent}
                fill={journey.streakAtRisk ? 'transparent' : colors.secondary}
                strokeWidth={2}
                absoluteStrokeWidth
              />
              <Text style={styles.streakText}>{journey.streakMonths} mo</Text>
            </View>
          ) : null}
        </View>

        <View
          style={styles.track}
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 0, max: 100, now: Math.round(journey.progress * 100) }}
        >
          <Animated.View style={[styles.bar, barStyle]} />
        </View>
        <View style={styles.captionRow}>
          <Text style={styles.caption}>{journey.caption}</Text>
          <Text style={styles.count}>
            {earned}/{journey.badges.length}
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.badges}
          accessibilityLabel="Badges"
        >
          {journey.badges.map((badge, index) => (
            <BadgeMedal
              key={badge.id}
              id={badge.id}
              label={badge.label}
              unlocked={badge.unlocked}
              index={index}
              onPress={onSeeAll}
            />
          ))}
        </ScrollView>

        {next ? (
          <View style={styles.next} accessibilityLabel={`Next badge: ${next.label}. ${next.hint}`}>
            <View style={styles.nextIcon}>
              <Lock size={14} color={colors.muted} strokeWidth={2} absoluteStrokeWidth />
            </View>
            <View style={styles.nextCopy}>
              <Text style={styles.nextTitle}>Next badge: {next.label}</Text>
              <Text style={styles.nextHint}>{next.hint}</Text>
            </View>
          </View>
        ) : null}

        {onSeeAll ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="See all badges"
            onPress={onSeeAll}
            hitSlop={8}
            style={styles.seeAll}
          >
            <Text style={styles.seeAllText}>See all badges</Text>
            <ChevronRight size={16} color={colors.accent} strokeWidth={2} absoluteStrokeWidth />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadowShell: {
    borderRadius: radius.lg,
    ...shadow.card,
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 2,
  },
  card: {
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  levelTile: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  eyebrow: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightSemibold,
    color: colors.accent,
  },
  levelTitle: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
    letterSpacing: -0.2,
  },
  streakChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: colors.amberSoft,
  },
  streakChipRisk: {
    backgroundColor: colors.sidebar,
  },
  streakText: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightSemibold,
    color: colors.accentHover,
  },
  track: {
    height: 10,
    borderRadius: radius.full,
    backgroundColor: colors.sidebar,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: radius.full,
    backgroundColor: colors.accent,
  },
  captionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  caption: {
    flex: 1,
    fontSize: typography.sizeSm,
    lineHeight: typography.sizeSm * 1.4,
    color: colors.inkSoft,
  },
  count: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightSemibold,
    color: colors.muted,
  },
  badges: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  next: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.bg,
  },
  nextIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextCopy: {
    flex: 1,
    minWidth: 0,
  },
  nextTitle: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
  },
  nextHint: {
    fontSize: typography.sizeXs,
    lineHeight: typography.sizeXs * 1.4,
    color: colors.muted,
  },
  seeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: 2,
    minHeight: 32,
  },
  seeAllText: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightMedium,
    color: colors.accent,
  },
});
