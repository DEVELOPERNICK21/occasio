import { Pressable, StyleSheet, View } from 'react-native';
import { Button } from '../../../../shared/ui/Button';
import { Text } from '../../../../shared/ui/Text';
import { colors, radius, spacing, typography } from '../../../../shared/theme/tokens';
import type { Suggestion } from '../../domain/festivalCoach';
import type { Holiday } from '../../domain/holidays';
import { wishesUsedBody } from '../../domain/homePlan';
import { getTemplateTheme } from '../../domain/templateTheme';

type Props = {
  holiday: Holiday;
  /** Who else in the Vault has not had this festival's wish yet, best first. */
  suggested: readonly Suggestion[];
  onPick: (suggestion: Suggestion) => void;
  /**
   * No wish left to spend. The people are still named, but a tap would only start a card that cannot be finished, so
   * it says what the options are and offers the plans instead.
   */
  noWishesLeft?: boolean;
  onSeePlans?: () => void;
};

/**
 * After a festival card is shared: the other people it is for. One tap starts the next card for them, with their
 * name and the sender's already filled in, which is how one festival becomes five wishes instead of one.
 */
export function FestivalNextPeople({ holiday, suggested, onPick, noWishesLeft = false, onSeePlans }: Props) {
  if (suggested.length === 0) return null;
  const theme = getTemplateTheme(holiday.id);
  const shown = suggested.slice(0, 3);
  if (noWishesLeft && onSeePlans) {
    return (
      <View style={[styles.card, { backgroundColor: theme.softBackground, borderColor: theme.accentSecondary }]}>
        <Text style={styles.title}>Wish someone else this {holiday.label}</Text>
        <Text style={styles.body}>{wishesUsedBody(shown.map((s) => s.person.name))}</Text>
        <Button label="See plans" variant="secondary" onPress={onSeePlans} />
      </View>
    );
  }
  return (
    <View style={[styles.card, { backgroundColor: theme.softBackground, borderColor: theme.accentSecondary }]}>
      <Text style={styles.title}>Wish someone else this {holiday.label}</Text>
      <Text style={styles.body}>They are in your Vault. A name is all it takes to start.</Text>
      <View style={styles.chips}>
        {shown.map((suggestion) => (
          <Pressable
            key={suggestion.person.id}
            accessibilityRole="button"
            accessibilityLabel={`Make a ${holiday.label} wish for ${suggestion.person.name}`}
            onPress={() => onPick(suggestion)}
            style={({ pressed }) => [styles.chip, { borderColor: theme.accent }, pressed && styles.pressed]}
          >
            <Text style={[styles.chipText, { color: theme.accent }]} numberOfLines={1}>
              {suggestion.person.name.trim().split(/\s+/)[0]}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  title: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
    letterSpacing: -0.2,
  },
  body: {
    fontSize: typography.sizeSm,
    lineHeight: typography.sizeSm * 1.4,
    color: colors.inkSoft,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    minHeight: 44,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    borderRadius: radius.full,
    borderWidth: 1.5,
    backgroundColor: colors.surface,
  },
  pressed: {
    opacity: 0.8,
  },
  chipText: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightSemibold,
  },
});
