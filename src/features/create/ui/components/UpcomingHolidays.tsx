import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { CalendarHeart, ChevronRight } from '../../../../shared/ui/icons/lucide';
import { Text } from '../../../../shared/ui/Text';
import { colors, radius, spacing, typography } from '../../../../shared/theme/tokens';
import {
  countdownLabel,
  holidayDateLabel,
  type Holiday,
  type HolidayOccurrence,
} from '../../domain/holidays';
import { getTemplateTheme } from '../../domain/templateTheme';
import { FestivalArt } from '../../../../shared/ui/art/FestivalArt';
import { festivalArtFor } from '../../domain/festivalArt';
import { TemplateOccasionIcon } from './TemplateOccasionIcon';

type Props = {
  /** The festivals coming up, soonest first. */
  items: readonly HolidayOccurrence[];
  /** The day it is, so dates read as "Fri 20 Nov" this year and carry the year after. */
  now: Date;
  /** Starts a card for that festival. */
  onPick: (holiday: Holiday) => void;
  /** Opens every festival and holiday. */
  onSeeAll: () => void;
  /** A line under a festival's date, by festival id: "For Priya, Mom and 2 more". */
  hints?: Readonly<Record<string, string>>;
};

/** A festival this close gets the accent colour, so tomorrow is easy to tell from next month. */
const CLOSE_DAYS = 1;

/**
 * The festivals coming up, in a swipeable row at the top of the screen, so nobody has to open the
 * list to find the next one. Tap a card to start a wish for it. The side padding matches `Screen`
 * (spacing.lg): the row runs to the screen edge while its first card lines up with the text.
 */
export function UpcomingHolidays({ items, now, onPick, onSeeAll, hints }: Props) {
  if (items.length === 0) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Festivals and holidays"
        accessibilityHint="Opens the list of festivals and holidays"
        onPress={onSeeAll}
        hitSlop={8}
        style={styles.emptyLink}
      >
        <CalendarHeart size={18} color={colors.accent} strokeWidth={2} absoluteStrokeWidth />
        <Text style={styles.emptyText}>Festivals and holidays</Text>
        <ChevronRight size={16} color={colors.accent} strokeWidth={2} absoluteStrokeWidth />
      </Pressable>
    );
  }

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <CalendarHeart size={18} color={colors.ink} strokeWidth={2} absoluteStrokeWidth />
          <Text style={styles.title}>Festivals coming up</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="See all festivals and holidays"
          onPress={onSeeAll}
          hitSlop={8}
          style={styles.seeAll}
        >
          <Text style={styles.seeAllText}>See all</Text>
          <ChevronRight size={16} color={colors.accent} strokeWidth={2} absoluteStrokeWidth />
        </Pressable>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scroller}
        contentContainerStyle={styles.cards}
        accessibilityLabel="Festivals coming up"
      >
        {items.map(({ holiday, date, daysUntil }) => {
          const theme = getTemplateTheme(holiday.id);
          const when = countdownLabel(daysUntil);
          const day = holidayDateLabel(date, now);
          const art = festivalArtFor(holiday.id);
          const hint = hints?.[holiday.id];
          return (
            <Pressable
              key={holiday.id}
              accessibilityRole="button"
              accessibilityLabel={`${holiday.label}. ${when}, ${day}${hint ? `. ${hint}` : ''}`}
              accessibilityHint="Starts a card for this festival"
              onPress={() => onPick(holiday)}
              android_ripple={{ color: theme.softBackground, borderless: false }}
              style={({ pressed }) => [
                styles.card,
                { backgroundColor: theme.softBackground, borderColor: theme.accentSecondary },
                pressed && styles.pressed,
              ]}
            >
              <View style={[styles.icon, { backgroundColor: colors.surface }]}>
                {art ? (
                  <FestivalArt motif={art.hero} size={34} />
                ) : (
                  <TemplateOccasionIcon templateType={holiday.id} size={20} color={theme.accent} />
                )}
              </View>
              <Text style={styles.name} numberOfLines={2}>
                {holiday.label}
              </Text>
              <View style={styles.when}>
                <Text
                  style={[styles.whenText, { color: daysUntil <= CLOSE_DAYS ? theme.accent : colors.ink }]}
                  numberOfLines={1}
                >
                  {when}
                </Text>
                <Text style={styles.day} numberOfLines={1}>
                  {day}
                </Text>
                {hint ? (
                  <Text style={[styles.hint, { color: theme.accent }]} numberOfLines={1}>
                    {hint}
                  </Text>
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleRow: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
  },
  seeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    minHeight: 32,
  },
  seeAllText: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightMedium,
    color: colors.accent,
  },
  scroller: {
    marginHorizontal: -spacing.lg,
  },
  cards: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  card: {
    width: 148,
    minHeight: 148,
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  pressed: {
    opacity: 0.85,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
    lineHeight: typography.sizeMd * 1.2,
    color: colors.ink,
    letterSpacing: -0.2,
  },
  when: {
    marginTop: 'auto',
    gap: 1,
  },
  whenText: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightSemibold,
  },
  day: {
    fontSize: typography.sizeXs,
    color: colors.inkSoft,
  },
  hint: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightMedium,
  },
  emptyLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 32,
  },
  emptyText: {
    flex: 1,
    fontSize: typography.sizeSm,
    fontWeight: typography.weightMedium,
    color: colors.accent,
  },
});
