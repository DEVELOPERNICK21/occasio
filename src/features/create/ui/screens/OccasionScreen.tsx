import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { AnalyticsEvents, trackEvent } from '../../../../shared/analytics/events';
import type { CreateStackParamList } from '../../../../shared/navigation/types';
import { colors, spacing, typography } from '../../../../shared/theme/tokens';
import { Screen } from '../../../../shared/ui/Screen';
import { Text } from '../../../../shared/ui/Text';
import { useCreateDraftContext } from '../../application/CreateDraftContext';
import {
  audienceLabel,
  OCCASION_OPTIONS,
} from '../../domain/audienceOccasion';
import { getTemplateTheme } from '../../domain/templateTheme';
import type { Occasion } from '../../domain/templateSchema';
import { OccasionCard } from '../components/OccasionCard';
import { CreateNudge, CreateProgress } from '../components/CreateProgress';

type Props = NativeStackScreenProps<CreateStackParamList, 'Occasion'>;

export function OccasionScreen({ navigation }: Props) {
  const { draft, setOccasion } = useCreateDraftContext();
  const who = audienceLabel(draft.audience);
  const subtitle = who
    ? `A moment that fits ${who}.`
    : 'Pick the feeling that fits — then add a photo.';

  const selectOccasion = (occasion: Occasion) => {
    setOccasion(occasion);
    trackEvent(AnalyticsEvents.occasionSelected, { occasion });
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
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Festivals and holidays"
        accessibilityHint="Opens the list of festivals and holidays"
        onPress={() => navigation.navigate('Holidays', { fromOccasion: true })}
        hitSlop={8}
        style={styles.festivals}
      >
        <Text style={styles.festivalsText}>Making it for a festival or holiday?</Text>
        <ChevronRight size={16} color={colors.accent} strokeWidth={2} absoluteStrokeWidth />
      </Pressable>
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
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 2,
    minHeight: 32,
    marginTop: spacing.md,
  },
  festivalsText: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightMedium,
    color: colors.accent,
  },
  hint: {
    marginTop: spacing.md,
    fontSize: typography.sizeSm,
    lineHeight: typography.sizeSm * 1.4,
    color: colors.muted,
  },
});
