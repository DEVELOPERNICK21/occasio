import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../../../../shared/ui/Text';
import { useCreateDraftContext } from '../../application/CreateDraftContext';
import { TEMPLATE_OPTIONS } from '../../domain/templates';
import type { CreateStackParamList } from '../../../../shared/navigation/types';
import { Button } from '../../../../shared/ui/Button';
import { Screen } from '../../../../shared/ui/Screen';
import { colors, radius, spacing, typography } from '../../../../shared/theme/tokens';

type Props = NativeStackScreenProps<CreateStackParamList, 'TemplatePicker'>;

export function TemplatePickerScreen({ navigation }: Props) {
  const { draft, setTemplate } = useCreateDraftContext();

  return (
    <Screen
      title="Create a wish"
      subtitle="Pick an occasion"
      footer={
        <Button
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
              onPress={() => setTemplate(t.id)}
              style={[styles.card, selected && styles.cardSelected]}
            >
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
    minHeight: 96,
  },
  cardSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
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
