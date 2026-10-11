import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { colors, radius, spacing, typography } from '../../../../shared/theme/tokens';
import { Text } from '../../../../shared/ui/Text';
import { useCreateDraftContext } from '../../application/CreateDraftContext';
import { getCreateProgress, type CreateStage } from '../../domain/createProgress';

const FILL_MS = 520;
const TRACK_HEIGHT = 6;
/** A bar that starts with a little in it reads as already under way. */
const HEAD_START = 0.06;

/**
 * Each create screen mounts its own bar, so the last value is remembered here
 * and the next bar grows from it. Moving forward then reads as one continuous
 * bar filling up rather than a fresh bar starting at zero.
 */
let lastFraction = 0;

type Props = {
  stage: CreateStage;
};

function useCreateProgress(stage: CreateStage) {
  const { draft } = useCreateDraftContext();
  return getCreateProgress({
    stage,
    isQuickCreate: !draft.audience,
    photoCount: draft.photoUris.filter(Boolean).length,
    hasRecipient: draft.recipientName.trim().length > 0,
    hasFrom: draft.fromName.trim().length > 0,
    hasMessage: draft.message.trim().length > 0,
  });
}

/**
 * The slim bar for a screen's fixed header: where you are and what is left.
 * Kept small so it never crowds the content on short phones.
 */
export function CreateProgress({ stage }: Props) {
  const progress = useCreateProgress(stage);

  const fill = useSharedValue(lastFraction);

  useEffect(() => {
    fill.value = withTiming(Math.max(progress.fraction, HEAD_START), {
      duration: FILL_MS,
      easing: Easing.out(Easing.cubic),
    });
    lastFraction = progress.fraction;
  }, [fill, progress.fraction]);

  const fillStyle = useAnimatedStyle(() => ({ width: `${fill.value * 100}%` }));

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`Step ${progress.current} of ${progress.total}, ${progress.stageLabel}. ${progress.timeLeft}.`}
      accessibilityValue={{ min: 0, max: 100, now: progress.percent }}
      style={styles.root}
    >
      <View style={styles.labels}>
        <Text style={styles.step}>
          <Text style={styles.stepStrong}>{progress.stageLabel}</Text>
          {`  ${progress.current} of ${progress.total}`}
        </Text>
        <Text style={styles.time}>{progress.timeLeft}</Text>
      </View>

      <View style={styles.track}>
        <Animated.View style={[styles.fill, fillStyle]} />
        {progress.stages.slice(1).map((item, i) => (
          <View
            key={item.id}
            style={[styles.notch, { left: `${((i + 1) / progress.total) * 100}%` }]}
          />
        ))}
      </View>
    </View>
  );
}

/** The one thing worth doing next. Lives in the scrolling body, first, so it scrolls away. */
export function CreateNudge({ stage }: Props) {
  const progress = useCreateProgress(stage);
  return (
    <View style={styles.nudgePill}>
      <Sparkles size={14} color={colors.accentHover} strokeWidth={2.2} absoluteStrokeWidth />
      <Text style={styles.nudge} numberOfLines={2}>
        {progress.nudge}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  labels: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  step: {
    fontSize: typography.sizeXs,
    color: colors.muted,
  },
  stepStrong: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
  },
  time: {
    fontSize: typography.sizeXs,
    color: colors.muted,
  },
  track: {
    height: TRACK_HEIGHT,
    borderRadius: radius.full,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  fill: {
    height: TRACK_HEIGHT,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
  },
  notch: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    marginLeft: -1,
    backgroundColor: colors.bg,
  },
  nudgePill: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.sidebar,
  },
  nudge: {
    flex: 1,
    fontSize: typography.sizeSm,
    lineHeight: typography.sizeSm * 1.4,
    color: colors.inkSoft,
  },
});
