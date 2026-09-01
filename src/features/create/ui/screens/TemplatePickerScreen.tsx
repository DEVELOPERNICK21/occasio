import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AnalyticsEvents, trackEvent } from '../../../../shared/analytics/events';
import { Text } from '../../../../shared/ui/Text';
import { useCreateDraftContext } from '../../application/CreateDraftContext';
import { TEMPLATE_OPTIONS } from '../../domain/templates';
import type { CreateStackParamList } from '../../../../shared/navigation/types';
import { Screen } from '../../../../shared/ui/Screen';
import { ScreenHeaderAction } from '../../../../shared/ui/ScreenHeaderAction';
import { colors, radius, shadow, spacing, typography } from '../../../../shared/theme/tokens';

type Props = NativeStackScreenProps<CreateStackParamList, 'TemplatePicker'>;

const CREATE_STEPS = 4;

export function TemplatePickerScreen({ navigation }: Props) {
  const { draft, setTemplate } = useCreateDraftContext();

  useEffect(() => {
    trackEvent(AnalyticsEvents.createStarted);
  }, []);

  const selectTemplate = (id: typeof TEMPLATE_OPTIONS[number]['id']) => {
    setTemplate(id);
    trackEvent(AnalyticsEvents.templateSelected, { templateType: id });
  };

  return (
    <Screen
      title="Create a wish"
      subtitle="Pick an occasion"
      step={{ current: 1, total: CREATE_STEPS }}
      headerAction={
        <ScreenHeaderAction
          label="Continue"
          disabled={!draft.templateType}
          onPress={() => navigation.navigate('AddPhotos')}
        />
      }
    >
      <View style={styles.grid}>
        {TEMPLATE_OPTIONS.map((t) => {
          const selected = draft.templateType === t.id;
          return (
            <Pressable
              key={t.id}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => selectTemplate(t.id)}
              style={[styles.card, selected && styles.cardSelected]}
            >
              {selected ? (
                <View style={styles.check}>
                  <Text style={styles.checkLabel}>✓</Text>
                </View>
              ) : null}
              <Text style={styles.emoji}>{t.emoji}</Text>
              <Text style={styles.cardLabel}>{t.label}</Text>
              <Text style={styles.cardDesc}>{t.description}</Text>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  card: {
    width: '47%',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    minHeight: 112,
    ...shadow.card,
  },
  cardSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  check: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 22,
    height: 22,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkLabel: {
    color: colors.white,
    fontSize: typography.sizeXs,
    fontWeight: typography.weightSemibold,
    lineHeight: 14,
  },
  emoji: {
    fontSize: 28,
    lineHeight: 32,
    marginBottom: spacing.sm,
  },
  cardLabel: {
    fontSize: typography.sizeMd,
    lineHeight: typography.sizeMd * 1.25,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
  },
  cardDesc: {
    marginTop: spacing.xs,
    fontSize: typography.sizeSm,
    lineHeight: typography.sizeSm * 1.3,
    color: colors.muted,
  },
});
