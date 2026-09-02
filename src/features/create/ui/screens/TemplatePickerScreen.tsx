import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { AnalyticsEvents, trackEvent } from '../../../../shared/analytics/events';
import { triggerCardHaptic } from '../../../../shared/platform/haptics';
import { Text } from '../../../../shared/ui/Text';
import { Screen } from '../../../../shared/ui/Screen';
import { useCreateDraftContext } from '../../application/CreateDraftContext';
import { getTemplateTheme } from '../../domain/templateTheme';
import { TEMPLATE_OPTIONS } from '../../domain/templates';
import type { TemplateType } from '../../domain/types';
import { TemplateOptionCard } from '../components/TemplateOptionCard';
import type { CreateStackParamList } from '../../../../shared/navigation/types';
import { colors, radius, spacing, typography } from '../../../../shared/theme/tokens';

type Props = NativeStackScreenProps<CreateStackParamList, 'TemplatePicker'>;

const CREATE_STEPS = 4;

export function TemplatePickerScreen({ navigation }: Props) {
  const { startWish } = useCreateDraftContext();

  useEffect(() => {
    trackEvent(AnalyticsEvents.createStarted);
  }, []);

  const pickTemplate = (templateType: TemplateType) => {
    triggerCardHaptic();
    startWish({ templateType, recipientName: '' });
    trackEvent(AnalyticsEvents.templateSelected, { templateType });
    navigation.navigate('AddPhotos');
  };

  return (
    <Screen
      title="Create a wish"
      subtitle="Who is this for? Pick the occasion that fits the moment."
      step={{ current: 1, total: CREATE_STEPS }}
      onBack={() => navigation.goBack()}
    >
      <View style={styles.trustStrip}>
        <Text style={styles.trustText}>
          No account needed to share · You can change anything before sending
        </Text>
      </View>

      <View style={styles.grid}>
        {TEMPLATE_OPTIONS.map((template) => (
          <TemplateOptionCard
            key={template.id}
            template={template}
            theme={getTemplateTheme(template.id)}
            onPress={() => pickTemplate(template.id)}
          />
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  trustStrip: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  trustText: {
    fontSize: typography.sizeSm,
    lineHeight: typography.sizeSm * 1.45,
    color: colors.inkSoft,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: spacing.sm,
    marginTop: spacing.lg,
  },
});
