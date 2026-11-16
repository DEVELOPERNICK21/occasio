import { Pressable, StyleSheet, View } from 'react-native';
import { Button } from '../../../../shared/ui/Button';
import { Text } from '../../../../shared/ui/Text';
import { FestivalArt } from '../../../../shared/ui/art/FestivalArt';
import { colors, radius, shadow, spacing, typography } from '../../../../shared/theme/tokens';
import { festivalArtFor } from '../../domain/festivalArt';
import { getTemplateTheme, holidayTheme } from '../../domain/templateTheme';

type Props = {
  /** The festival it is about: its colours and its drawing. Null for something else (a birthday). */
  holidayId: string | null;
  title: string;
  body: string;
  actionLabel: string;
  /** What "Not now" says to a screen reader, and what it does. */
  laterLabel: string;
  laterHint: string;
  onAction: () => void;
  onLater: () => void;
};

/**
 * One reminder at the top of Home: a festival that is close and the people it is for, or the moment a plan would
 * actually help. It says what is on offer in plain words, does the one thing in a tap, and can be put away.
 * The festival nudge and the plan prompt are the same card because they are the same promise: one calm sentence.
 */
export function ReminderCard({ holidayId, title, body, actionLabel, laterLabel, laterHint, onAction, onLater }: Props) {
  const theme = (holidayId ? holidayTheme(holidayId) : null) ?? getTemplateTheme('birthday');
  const art = festivalArtFor(holidayId);

  return (
    <View style={styles.shadowShell}>
      <View style={[styles.card, { backgroundColor: theme.softBackground, borderColor: theme.accentSecondary }]}>
        <View style={styles.top}>
          <View style={styles.art}>
            <FestivalArt motif={art?.hero ?? 'balloon'} size={44} />
          </View>
          <View style={styles.copy}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.body}>{body}</Text>
          </View>
        </View>
        <Button label={actionLabel} variant="secondary" onPress={onAction} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={laterLabel}
          accessibilityHint={laterHint}
          onPress={onLater}
          hitSlop={8}
          style={styles.later}
        >
          <Text style={[styles.laterText, { color: theme.accent }]}>Not now</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadowShell: {
    borderRadius: radius.lg,
    ...shadow.card,
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 2,
  },
  card: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  top: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  art: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
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
  later: {
    alignSelf: 'center',
    minHeight: 32,
    justifyContent: 'center',
  },
  laterText: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightMedium,
  },
});
