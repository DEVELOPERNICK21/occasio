import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AnalyticsEvents, trackEvent } from '../../../../shared/analytics/events';
import type { CreateStackParamList } from '../../../../shared/navigation/types';
import { colors, spacing, typography } from '../../../../shared/theme/tokens';
import { Screen } from '../../../../shared/ui/Screen';
import { Text } from '../../../../shared/ui/Text';
import { useCreateDraftContext } from '../../application/CreateDraftContext';
import { comingUpHolidays, type Holiday } from '../../domain/holidays';
import {
  audienceLabel,
  OCCASION_OPTIONS,
} from '../../domain/audienceOccasion';
import { getTemplateTheme } from '../../domain/templateTheme';
import type { Occasion } from '../../domain/templateSchema';
import { OccasionCard } from '../components/OccasionCard';
import { CreateNudge, CreateProgress } from '../components/CreateProgress';
import { UpcomingHolidays } from '../components/UpcomingHolidays';

type Props = NativeStackScreenProps<CreateStackParamList, 'Occasion'>;

export function OccasionScreen({ navigation }: Props) {
  const { draft, setOccasion, startFromHoliday } = useCreateDraftContext();
  const today = useMemo(() => new Date(), []);
  const festivals = useMemo(() => comingUpHolidays(today), [today]);
  const who = audienceLabel(draft.audience);
  const subtitle = who
    ? `A moment that fits ${who}.`
    : 'Pick the feeling that fits — then add a photo.';

  const selectOccasion = (occasion: Occasion) => {
    setOccasion(occasion);
    trackEvent(AnalyticsEvents.occasionSelected, { occasion });
    navigation.navigate('AddPhotos');
  };

  // A festival coming up is one tap from here, keeping who the card is for.
  const selectFestival = (holiday: Holiday) => {
    startFromHoliday(holiday.id, true);
    trackEvent(AnalyticsEvents.holidaySelected, {
      holiday: holiday.id,
      group: holiday.group,
      source: 'occasion',
    });
    navigation.navigate('AddPhotos');
  };

  return (
    <Screen
      title="What’s the moment?"
      subtitle={subtitle}
      progress={<CreateProgress stage="occasion" />}
      onBack={() => navigation.goBack()}
    >
      <CreateNudge stage="occasion" />
      <View style={styles.festivals}>
        <UpcomingHolidays
          items={festivals}
          now={today}
          onPick={selectFestival}
          onSeeAll={() => navigation.navigate('Holidays', { fromOccasion: true })}
        />
      </View>
      <View style={styles.options}>
        {OCCASION_OPTIONS.map((option) => {
          const theme = getTemplateTheme(option.id);
          return (
            <OccasionCard
              key={option.id}
              occasion={option.id}
              label={option.label}
              cue={theme.emotionalCue}
              theme={theme}
              selected={draft.occasion === option.id}
              onPress={() => selectOccasion(option.id)}
            />
          );
        })}
      </View>
      <Text style={styles.hint}>
        You will add a photo next — the frame comes after.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  options: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  festivals: {
    marginTop: spacing.md,
  },
  hint: {
    marginTop: spacing.lg,
    fontSize: typography.sizeSm,
    lineHeight: typography.sizeSm * 1.4,
    color: colors.muted,
  },
});
