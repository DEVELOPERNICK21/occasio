import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AnalyticsEvents, trackEvent } from '../../../../shared/analytics/events';
import { Field } from '../../../../shared/ui/Field';
import { TextInput } from '../../../../shared/ui/TextInput';
import { Text } from '../../../../shared/ui/Text';
import { Button } from '../../../../shared/ui/Button';
import { Screen } from '../../../../shared/ui/Screen';
import { ScreenActions } from '../../../../shared/ui/ScreenActions';
import { ScreenHeaderAction } from '../../../../shared/ui/ScreenHeaderAction';
import { colors, radius, spacing, typography } from '../../../../shared/theme/tokens';
import type { VaultStackParamList } from '../../../../shared/navigation/types';
import { useVaultPeople } from '../../application/useVaultPeople';
import { useSavePerson } from '../../application/useSavePerson';
import { RELATIONSHIP_OPTIONS } from '../../domain/relationshipTypes';
import { EMPTY_PERSON_DRAFT, type PersonDraft } from '../../domain/types';

type Props = NativeStackScreenProps<VaultStackParamList, 'AddPerson'>;

export function AddPersonScreen({ navigation, route }: Props) {
  const prefilledName = route.params?.prefilledName ?? '';
  const [draft, setDraft] = useState<PersonDraft>({
    ...EMPTY_PERSON_DRAFT,
    personName: prefilledName,
  });
  const [autoSendBirthday, setAutoSendBirthday] = useState(false);

  const { people } = useVaultPeople(true);
  const { save, isSaving, error, canEnableAutoSend, personCapReached, clearError } =
    useSavePerson({ currentCount: people.length });

  useEffect(() => {
    if (prefilledName) {
      trackEvent(AnalyticsEvents.vaultSavePromptTapped);
    }
  }, [prefilledName]);

  const updateDraft = (patch: Partial<PersonDraft>) => {
    clearError();
    setDraft((current) => ({ ...current, ...patch }));
  };

  const handleSave = async () => {
    const person = await save(draft, autoSendBirthday);
    if (person) {
      navigation.navigate('VaultList');
    }
  };

  return (
    <Screen
      title="Add person"
      subtitle="Save someone for next year"
      headerAction={
        <ScreenHeaderAction
          label={isSaving ? 'Saving…' : 'Save'}
          disabled={isSaving || personCapReached}
          onPress={() => void handleSave()}
        />
      }
    >
      {personCapReached ? (
        <Text style={styles.warn}>
          Free plan includes 1 saved person. Upgrade to save more (coming soon).
        </Text>
      ) : null}

      <View style={styles.form}>
        <Field label="Name">
          <TextInput
            placeholder="Their name"
            placeholderTextColor={colors.muted}
            value={draft.personName}
            onChangeText={(personName) => updateDraft({ personName })}
            style={styles.input}
            autoCapitalize="words"
          />
        </Field>

        <Field label="Relationship">
          <View style={styles.chips}>
            {RELATIONSHIP_OPTIONS.map((option) => {
              const selected = draft.relationshipType === option.id;
              return (
                <Pressable
                  key={option.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => updateDraft({ relationshipType: option.id })}
                  style={[styles.chip, selected && styles.chipSelected]}
                >
                  <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Field>

        <Field label="Birthday" hint="Month and day — needed for auto-send">
          <View style={styles.dateRow}>
            <TextInput
              placeholder="MM"
              placeholderTextColor={colors.muted}
              value={draft.birthdayMonth}
              onChangeText={(birthdayMonth) => updateDraft({ birthdayMonth })}
              keyboardType="number-pad"
              maxLength={2}
              style={[styles.input, styles.dateInput]}
            />
            <TextInput
              placeholder="DD"
              placeholderTextColor={colors.muted}
              value={draft.birthdayDay}
              onChangeText={(birthdayDay) => updateDraft({ birthdayDay })}
              keyboardType="number-pad"
              maxLength={2}
              style={[styles.input, styles.dateInput]}
            />
          </View>
        </Field>

        <Field label="WhatsApp" hint="Optional — for sending later">
          <TextInput
            placeholder="98765 43210"
            placeholderTextColor={colors.muted}
            value={draft.whatsapp}
            onChangeText={(whatsapp) => updateDraft({ whatsapp })}
            keyboardType="phone-pad"
            style={styles.input}
          />
        </Field>

        <View style={styles.autoSendRow}>
          <View style={styles.autoSendCopy}>
            <Text style={styles.autoSendTitle}>Auto-send on birthday</Text>
            <Text style={styles.autoSendHint}>
              {canEnableAutoSend
                ? 'We will remind you before sending (engine coming soon).'
                : 'Available on Plus — save the person now, upgrade later.'}
            </Text>
          </View>
          <Pressable
            accessibilityRole="switch"
            accessibilityState={{ checked: autoSendBirthday && canEnableAutoSend }}
            disabled={!canEnableAutoSend}
            onPress={() => setAutoSendBirthday((current) => !current)}
            style={[
              styles.toggle,
              autoSendBirthday && canEnableAutoSend && styles.toggleOn,
              !canEnableAutoSend && styles.toggleDisabled,
            ]}
          >
            <View
              style={[
                styles.toggleKnob,
                autoSendBirthday && canEnableAutoSend && styles.toggleKnobOn,
              ]}
            />
          </Pressable>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>

      <ScreenActions align="start">
        <Button label="Cancel" variant="ghost" onPress={() => navigation.goBack()} />
      </ScreenActions>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: {
    marginTop: spacing.md,
    gap: spacing.lg,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.sizeMd,
    color: colors.ink,
  },
  dateRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dateInput: {
    flex: 1,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  chipLabel: {
    fontSize: typography.sizeSm,
    color: colors.inkSoft,
  },
  chipLabelSelected: {
    color: colors.accent,
    fontWeight: typography.weightSemibold,
  },
  autoSendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.sidebar,
  },
  autoSendCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  autoSendTitle: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
  },
  autoSendHint: {
    fontSize: typography.sizeXs,
    lineHeight: typography.sizeXs * 1.4,
    color: colors.muted,
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: colors.border,
    padding: 2,
    justifyContent: 'center',
  },
  toggleOn: {
    backgroundColor: colors.accent,
  },
  toggleDisabled: {
    opacity: 0.5,
  },
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: radius.full,
    backgroundColor: colors.white,
  },
  toggleKnobOn: {
    alignSelf: 'flex-end',
  },
  error: {
    fontSize: typography.sizeSm,
    color: colors.error,
  },
  warn: {
    fontSize: typography.sizeSm,
    color: colors.error,
    marginBottom: spacing.sm,
  },
});
