import type { ComponentProps } from 'react';
import { CalendarDays } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../../../shared/ui/Text';
import { colors, radius, spacing, typography } from '../../../../shared/theme/tokens';
import type { Audience, Occasion } from '../../../create/domain/templateSchema';
import { countdownLine } from '../../domain/onboardingFlow';
import { PlanStep } from './PlanStep';

type PlanProps = ComponentProps<typeof PlanStep>;

type Props = PlanProps & {
  audience: Audience | null;
  occasion: Occasion | null;
  daysUntil: number | null;
};

/**
 * The offer, asked for once the person has felt the reason for it. When they
 * gave a date, their own countdown sits above the plans as the anchor: a real
 * day, not a manufactured deadline.
 */
export function OfferStep({ audience, occasion, daysUntil, ...plan }: Props) {
  return (
    <View style={styles.root}>
      {daysUntil !== null ? (
        <View style={styles.anchor}>
          <CalendarDays size={18} color={colors.accentHover} strokeWidth={2.2} />
          <Text style={styles.anchorText}>{countdownLine(audience, occasion, daysUntil)}</Text>
        </View>
      ) : null}
      <PlanStep {...plan} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.md },
  anchor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
  },
  anchorText: {
    flex: 1,
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
  },
});
