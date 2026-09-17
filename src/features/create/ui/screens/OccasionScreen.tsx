import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, View } from 'react-native';
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
import { getCreateStep } from '../createSteps';

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
      step={getCreateStep('occasion', false)}
      onBack={() => navigation.goBack()}
    >
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
  hint: {
    marginTop: spacing.lg,
    fontSize: typography.sizeSm,
    lineHeight: typography.sizeSm * 1.4,
    color: colors.muted,
  },
});
