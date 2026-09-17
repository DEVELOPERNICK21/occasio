import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, View } from 'react-native';
import { AnalyticsEvents, trackEvent } from '../../../../shared/analytics/events';
import type { CreateStackParamList } from '../../../../shared/navigation/types';
import { colors, radius, spacing, typography } from '../../../../shared/theme/tokens';
import { Screen } from '../../../../shared/ui/Screen';
import { Text } from '../../../../shared/ui/Text';
import { useCreateDraftContext } from '../../application/CreateDraftContext';
import { AUDIENCE_OPTIONS } from '../../domain/audienceOccasion';
import type { Audience } from '../../domain/templateSchema';

type Props = NativeStackScreenProps<CreateStackParamList, 'WhoFor'>;

export function WhoForScreen({ navigation }: Props) {
  const { draft, setAudience } = useCreateDraftContext();

  const selectAudience = (audience: Audience) => {
    setAudience(audience);
    trackEvent(AnalyticsEvents.audienceSelected, { audience });
    navigation.navigate('Occasion');
  };

  return (
    <Screen title="Who is this for?" onBack={() => navigation.goBack()}>
      <View style={styles.options}>
        {AUDIENCE_OPTIONS.map((option) => {
          const selected = draft.audience === option.id;
          return (
            <Pressable
              key={option.id}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => selectAudience(option.id)}
              style={({ pressed }) => [
                styles.option,
                selected && styles.optionSelected,
                pressed && styles.optionPressed,
              ]}
            >
              <Text style={styles.optionLabel}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  options: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  option: {
    minHeight: 56,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  optionSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  optionPressed: {
    opacity: 0.7,
  },
  optionLabel: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightMedium,
    color: colors.ink,
  },
});
