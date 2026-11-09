import { Pressable, StyleSheet, View } from 'react-native';
import { CalendarHeart, ChevronRight } from 'lucide-react-native';
import { CardWashBackground } from '../../../../shared/ui/CardWashBackground';
import { Text } from '../../../../shared/ui/Text';
import { colors, radius, shadow, spacing, typography } from '../../../../shared/theme/tokens';
import {
  holidayHeadlineLine,
  holidayPrompt,
  type HolidayOccurrence,
} from '../../domain/holidays';
import { getTemplateTheme } from '../../domain/templateTheme';
import { TemplateOccasionIcon } from './TemplateOccasionIcon';

type Props = {
  /** The festival to suggest, or null when none is close: the card then just opens the list. */
  occurrence: HolidayOccurrence | null;
  /** Starts a card for the suggested festival. */
  onStart: () => void;
  /** Opens every festival and holiday. */
  onSeeAll: () => void;
};

/**
 * Home's festival prompt: the next festival worth a wish ("Diwali is in 5 days"), one tap to start
 * it, and a quiet link to all of them. With nothing close it is just the way into the list.
 */
export function HolidayFeatureCard({ occurrence, onStart, onSeeAll }: Props) {
  const holiday = occurrence?.holiday ?? null;
  const theme = holiday ? getTemplateTheme(holiday.id) : null;
  const accent = theme?.accent ?? colors.accent;
  const soft = theme?.softBackground ?? colors.sidebar;

  const title = occurrence ? holidayHeadlineLine(occurrence) : 'Festivals and holidays';
  const prompt = occurrence
    ? holidayPrompt(occurrence)
    : 'Diwali, Eid, Christmas and more. Pick one and send a wish.';

  return (
    <View style={styles.shadowShell}>
      <View style={styles.card}>
        <CardWashBackground
          variant="upcoming"
          primary={theme?.orbPrimary ?? colors.accentSoft}
          secondary={theme?.orbSecondary ?? colors.secondary}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${title}. ${prompt}`}
          accessibilityHint={occurrence ? 'Starts a card for this festival' : 'Opens the list of festivals'}
          onPress={occurrence ? onStart : onSeeAll}
          style={({ pressed }) => [styles.main, pressed && styles.pressed]}
        >
          <View style={[styles.icon, { backgroundColor: soft, borderColor: theme?.accentSecondary ?? colors.border }]}>
            {holiday ? (
              <TemplateOccasionIcon templateType={holiday.id} size={22} color={accent} />
            ) : (
              <CalendarHeart size={22} color={accent} strokeWidth={2} absoluteStrokeWidth />
            )}
          </View>
          <View style={styles.copy}>
            <Text style={styles.title} numberOfLines={2}>
              {title}
            </Text>
            <Text style={styles.prompt} numberOfLines={2}>
              {prompt}
            </Text>
          </View>
          <ChevronRight size={18} color={colors.muted} strokeWidth={2} absoluteStrokeWidth />
        </Pressable>
        {occurrence ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="See all festivals and holidays"
            onPress={onSeeAll}
            hitSlop={8}
            style={styles.link}
          >
            <Text style={[styles.linkText, { color: accent }]}>All festivals and holidays</Text>
            <ChevronRight size={16} color={accent} strokeWidth={2} absoluteStrokeWidth />
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
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 2,
  },
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  main: {
    zIndex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  pressed: {
    opacity: 0.85,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
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
  prompt: {
    fontSize: typography.sizeXs,
    lineHeight: typography.sizeXs * 1.4,
    color: colors.inkSoft,
  },
  link: {
    zIndex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: 2,
    minHeight: 32,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xs,
  },
  linkText: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightMedium,
  },
});
