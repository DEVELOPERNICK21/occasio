import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AnalyticsEvents, trackEvent } from '../../../../shared/analytics/events';
import { triggerCardHaptic } from '../../../../shared/platform/haptics';
import type { CreateStackParamList } from '../../../../shared/navigation/types';
import { colors, spacing, typography } from '../../../../shared/theme/tokens';
import { Screen } from '../../../../shared/ui/Screen';
import { Text } from '../../../../shared/ui/Text';
import { useCreateDraftContext } from '../../application/CreateDraftContext';
import {
  countdownLabel,
  holidayDateLabel,
  holidaySections,
  upcomingHolidays,
  type Holiday,
} from '../../domain/holidays';
import { HolidayRow } from '../components/HolidayRow';

type Props = NativeStackScreenProps<CreateStackParamList, 'Holidays'>;

/** How many days ahead counts as "coming up", and how close counts as soon. */
const COMING_UP_DAYS = 60;
const SOON_DAYS = 14;

/** Every festival and holiday. Pick one and the card starts with its greeting, colours and openers. */
export function HolidaysScreen({ navigation, route }: Props) {
  const { startFromHoliday } = useCreateDraftContext();
  const keepAudience = route.params?.fromOccasion === true;
  const now = useMemo(() => new Date(), []);
  const comingUp = useMemo(
    () => upcomingHolidays(now, { withinDays: COMING_UP_DAYS, graceDays: 1, max: 6 }),
    [now],
  );
  const sections = useMemo(() => holidaySections(now), [now]);

  useEffect(() => {
    trackEvent(AnalyticsEvents.holidaysOpened);
  }, []);

  const pick = (holiday: Holiday) => {
    triggerCardHaptic();
    startFromHoliday(holiday.id, keepAudience);
    trackEvent(AnalyticsEvents.holidaySelected, { holiday: holiday.id, group: holiday.group });
    navigation.navigate('AddPhotos');
  };

  return (
    <Screen
      title="Festivals and holidays"
      subtitle="Pick one, add a photo, and send a wish that feels like you."
      onBack={() => navigation.goBack()}
    >
      {comingUp.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.heading}>Coming up</Text>
          {comingUp.map(({ holiday, date, daysUntil }) => (
            <HolidayRow
              key={holiday.id}
              holiday={holiday}
              detail={`${holiday.cue} · ${holidayDateLabel(date, now)}`}
              chip={countdownLabel(daysUntil)}
              soon={daysUntil <= SOON_DAYS}
              onPress={() => pick(holiday)}
            />
          ))}
        </View>
      ) : null}

      {sections.map((section) => (
        <View key={section.group} style={styles.section}>
          <Text style={styles.heading}>{section.title}</Text>
          {section.items.map(({ holiday, next }) => (
            <HolidayRow
              key={holiday.id}
              holiday={holiday}
              detail={next ? holidayDateLabel(next.date, now) : 'Date to be added'}
              chip={next && next.daysUntil <= SOON_DAYS ? countdownLabel(next.daysUntil) : undefined}
              soon
              onPress={() => pick(holiday)}
            />
          ))}
        </View>
      ))}

      <Text style={styles.note}>
        Dates of festivals that follow the moon can differ by a day depending on where you live.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  heading: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
  },
  note: {
    marginTop: spacing.lg,
    fontSize: typography.sizeSm,
    lineHeight: typography.sizeSm * 1.4,
    color: colors.muted,
  },
});
