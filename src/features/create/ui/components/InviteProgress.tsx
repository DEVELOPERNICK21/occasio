import { StyleSheet, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../../../shared/theme/tokens';
import { Text } from '../../../../shared/ui/Text';
import { inviteProgress, type InviteStage } from '../../domain/invitation';

const TRACK_HEIGHT = 6;

/** The slim bar at the top of each invitation step: where you are and how many steps there are. */
export function InviteProgress({ stage }: { stage: InviteStage }) {
  const progress = inviteProgress(stage);
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`Step ${progress.current} of ${progress.total}, ${progress.label}`}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(progress.fraction * 100) }}
      style={styles.root}
    >
      <Text style={styles.step}>
        <Text style={styles.stepStrong}>{progress.label}</Text>
        {`  ${progress.current} of ${progress.total}`}
      </Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progress.fraction * 100}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.sm,
    marginBottom: spacing.md,
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
});
