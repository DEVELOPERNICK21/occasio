import { StyleSheet, View } from 'react-native';
import { Text } from '../../../../shared/ui/Text';
import { colors, radius, spacing, typography } from '../../../../shared/theme/tokens';
import { readyUrgency } from '../../domain/onboardingFlow';
import { AutoSendTimeline } from './AutoSendTimeline';

type Props = {
  daysUntil: number | null;
};

/**
 * The relief, and the honest nudge: how Occasio makes sure it happens, and, only
 * when their day really is close, how little time the card takes.
 */
export function ReadyStep({ daysUntil }: Props) {
  const urgency = readyUrgency(daysUntil);
  return (
    <View style={styles.root}>
      {urgency ? (
        <View style={styles.urgency} accessibilityRole="summary">
          <Text style={styles.urgencyText}>{urgency}</Text>
        </View>
      ) : null}
      <AutoSendTimeline />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.md },
  urgency: {
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
  },
  urgencyText: {
    fontSize: typography.sizeMd,
    lineHeight: typography.sizeMd * 1.35,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
  },
});
