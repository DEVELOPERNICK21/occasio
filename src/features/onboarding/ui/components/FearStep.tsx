import { CalendarDays } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Text } from '../../../../shared/ui/Text';
import { colors, radius, spacing, typography } from '../../../../shared/theme/tokens';
import type { Audience, Occasion } from '../../../create/domain/templateSchema';
import { countdownLine } from '../../domain/onboardingFlow';
import { PipStage } from './PipStage';

type Props = {
  audience: Audience | null;
  occasion: Occasion | null;
  /** Days until their date, or `null` when they did not give one. */
  daysUntil: number | null;
};

/**
 * The cost of doing nothing. Pip cries (with the tiny violin: the same joke
 * the recipient's gate makes, so it hurts a little and lands kindly). The only
 * number here is their own date counting down; with no date, there is no number.
 */
export function FearStep({ audience, occasion, daysUntil }: Props) {
  return (
    <View style={styles.root}>
      <PipStage mood="cry" />
      {daysUntil !== null ? (
        <Animated.View entering={FadeInDown.duration(360).delay(120)} style={styles.pill}>
          <CalendarDays size={18} color={colors.accentHover} strokeWidth={2.2} />
          <Text style={styles.pillText}>{countdownLine(audience, occasion, daysUntil)}</Text>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'center', gap: spacing.md },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.accent,
    backgroundColor: colors.surface,
  },
  pillText: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
  },
});
