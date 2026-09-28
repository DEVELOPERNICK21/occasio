import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {
  BookHeart,
  Flame,
  Heart,
  Lock,
  Sparkles,
  Trophy,
  Users,
  type LucideIcon,
} from 'lucide-react-native';
import { Text } from '../../../../shared/ui/Text';
import { colors, radius, shadow, spacing, typography } from '../../../../shared/theme/tokens';
import type { WishBadgeId, WishJourney } from '../../domain/wishJourney';

type Props = {
  journey: WishJourney;
};

export const BADGE_STYLE: Record<WishBadgeId, { icon: LucideIcon; color: string; soft: string }> = {
  first_wish: { icon: Heart, color: colors.accent, soft: colors.accentSoft },
  three_wishes: { icon: Sparkles, color: colors.secondary, soft: colors.amberSoft },
  vault_saved: { icon: BookHeart, color: colors.sage, soft: colors.sageSoft },
  streak_two: { icon: Flame, color: colors.rose, soft: colors.roseSoft },
  five_people: { icon: Users, color: colors.accentHover, soft: colors.butterSoft },
};

function Badge({
  id,
  label,
  unlocked,
  index,
}: {
  id: WishBadgeId;
  label: string;
  unlocked: boolean;
  index: number;
}) {
  const pop = useSharedValue(0);
  const tone = BADGE_STYLE[id];
  const Icon = unlocked ? tone.icon : Lock;

  useEffect(() => {
    pop.value = withDelay(260 + index * 90, withSpring(1, { damping: 10, stiffness: 160 }));
  }, [index, pop]);

  const style = useAnimatedStyle(() => ({
    opacity: pop.value,
    transform: [{ scale: 0.6 + pop.value * 0.4 }],
  }));

  return (
    <Animated.View
      style={[styles.badge, style]}
      accessible
      accessibilityLabel={`${label} badge, ${unlocked ? 'earned' : 'locked'}`}
    >
      <View
        style={[
          styles.badgeCircle,
          unlocked
            ? { backgroundColor: tone.soft, borderColor: tone.color }
            : styles.badgeLocked,
        ]}
      >
        <Icon
          size={unlocked ? 18 : 14}
          color={unlocked ? tone.color : colors.muted}
          fill={unlocked && id === 'first_wish' ? tone.color : 'transparent'}
          strokeWidth={2}
          absoluteStrokeWidth
        />
      </View>
      <Text
        style={[styles.badgeLabel, !unlocked && styles.badgeLabelLocked]}
        numberOfLines={2}
      >
        {label}
      </Text>
    </Animated.View>
  );
}

/** Level, streak and badges — real History/Vault counts only. */
export function WishJourneyCard({ journey }: Props) {
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

        <View style={styles.badges}>
          {journey.badges.map((badge, index) => (
            <Badge
              key={badge.id}
              id={badge.id}
              label={badge.label}
              unlocked={badge.unlocked}
              index={index}
            />
          ))}
        </View>
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
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  badge: {
    width: '19%',
    alignItems: 'center',
    gap: 4,
  },
  badgeCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeLocked: {
    backgroundColor: colors.bg,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  badgeLabel: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: typography.weightSemibold,
    color: colors.inkSoft,
    textAlign: 'center',
  },
  badgeLabelLocked: {
    color: colors.muted,
  },
});
