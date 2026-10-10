import { Pressable, StyleSheet, View } from 'react-native';
import { DateField } from '../../../../shared/ui/DateField';
import { Text } from '../../../../shared/ui/Text';
import { colors, radius, spacing, typography } from '../../../../shared/theme/tokens';
import type { Occasion } from '../../../create/domain/templateSchema';
import { DATE_OCCASIONS, SKIP_DATE_LABEL } from '../../domain/onboardingFlow';

type Props = {
  occasion: Occasion | null;
  dateText: string;
  onOccasion: (occasion: Occasion) => void;
  onDate: (text: string) => void;
  onSkip: () => void;
};

/** One date, one tap to say which kind. Never a dead end: not knowing it is a normal answer. */
export function DateStep({ occasion, dateText, onOccasion, onDate, onSkip }: Props) {
  return (
    <View style={styles.root}>
      <View style={styles.chips} accessibilityRole="radiogroup">
        {DATE_OCCASIONS.map((option) => {
          const selected = option.id === occasion;
          return (
            <Pressable
              key={option.id}
              accessibilityRole="radio"
              accessibilityLabel={option.label}
              accessibilityState={{ selected }}
              onPress={() => onOccasion(option.id)}
              style={({ pressed }) => [styles.chip, selected && styles.chipSelected, pressed && styles.pressed]}
            >
              <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <DateField
        value={dateText}
        onChangeText={onDate}
        placeholder="Pick the date"
        accessibilityLabel="Pick the date"
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={SKIP_DATE_LABEL}
        onPress={onSkip}
        hitSlop={10}
        style={styles.skip}
      >
        <Text style={styles.skipLabel}>{SKIP_DATE_LABEL}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.md },
  chips: { flexDirection: 'row', gap: spacing.sm },
  chip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
  pressed: { opacity: 0.85 },
  chipLabel: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
    color: colors.inkSoft,
  },
  chipLabelSelected: { color: colors.white },
  skip: { alignSelf: 'center', paddingVertical: spacing.xs },
  skipLabel: {
    fontSize: typography.sizeSm,
    color: colors.muted,
    textDecorationLine: 'underline',
    fontWeight: typography.weightMedium,
  },
});
