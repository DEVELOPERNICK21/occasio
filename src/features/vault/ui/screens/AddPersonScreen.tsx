import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnalyticsEvents, trackEvent } from '../../../../shared/analytics/events';
import { triggerCardHaptic } from '../../../../shared/platform/haptics';
import { Text } from '../../../../shared/ui/Text';
import { colors, spacing, typography } from '../../../../shared/theme/tokens';
import type { VaultStackParamList } from '../../../../shared/navigation/types';
import { useVaultPeople } from '../../application/useVaultPeople';
import { useSavePerson } from '../../application/useSavePerson';
import { parseBirthdayInput } from '../../domain/personRules';
import { EMPTY_PERSON_DRAFT, type PersonDraft } from '../../domain/types';
import { AddPersonAutoSendCard } from '../components/AddPersonAutoSendCard';
import {
  AddPersonNameField,
  BirthdayDateField,
  OccasionTypeField,
} from '../components/AddPersonFormFields';
import { AddPersonHero } from '../components/AddPersonHero';
import { AddPersonDivider, AddPersonSection } from '../components/AddPersonSection';
import { RelationshipChipGrid } from '../components/RelationshipChipGrid';

type Props = NativeStackScreenProps<VaultStackParamList, 'AddPerson'>;

export function AddPersonScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const prefilledName = route.params?.prefilledName ?? '';
  const [draft, setDraft] = useState<PersonDraft>({
    ...EMPTY_PERSON_DRAFT,
    personName: prefilledName,
  });
  const [birthdayInput, setBirthdayInput] = useState('');
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

  const handleBirthdayChange = (text: string) => {
    setBirthdayInput(text);
    const parsed = parseBirthdayInput(text);
    if (parsed) {
      updateDraft({
        birthdayMonth: parsed.month,
        birthdayDay: parsed.day,
      });
      return;
    }
    if (!text.trim()) {
      updateDraft({ birthdayMonth: '', birthdayDay: '' });
    }
  };

  const handleSave = async () => {
    triggerCardHaptic();
    const person = await save(draft, autoSendBirthday);
    if (person) {
      navigation.navigate('VaultList');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => navigation.goBack()}
          hitSlop={8}
          style={styles.backButton}
        >
          <Text style={styles.backLabel}>←</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Save person"
          disabled={isSaving || personCapReached}
          onPress={() => void handleSave()}
          hitSlop={8}
        >
          <Text
            style={[
              styles.saveLabel,
              (isSaving || personCapReached) && styles.saveDisabled,
            ]}
          >
            {isSaving ? 'Saving…' : 'Save'}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <AddPersonHero />

        {personCapReached ? (
          <Text style={styles.warn}>
            Free plan includes 1 saved person. Upgrade to save more (coming soon).
          </Text>
        ) : null}

        <View style={styles.form}>
          <AddPersonSection label="The individual">
            <AddPersonNameField
              value={draft.personName}
              onChangeText={(personName) => updateDraft({ personName })}
            />
          </AddPersonSection>

          <AddPersonSection label="Relationship">
            <RelationshipChipGrid
              value={draft.relationshipType}
              onChange={(relationshipType) => updateDraft({ relationshipType })}
            />
          </AddPersonSection>

          <AddPersonDivider />

          <AddPersonSection label="Occasion type">
            <OccasionTypeField />
          </AddPersonSection>

          <AddPersonSection label="Select date">
            <BirthdayDateField
              value={birthdayInput}
              onChangeText={handleBirthdayChange}
            />
          </AddPersonSection>

          <AddPersonAutoSendCard
            enabled={autoSendBirthday && canEnableAutoSend}
            disabled={!canEnableAutoSend}
            onToggle={() => setAutoSendBirthday((current) => !current)}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  backButton: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
  },
  backLabel: {
    fontSize: typography.sizeLg,
    color: colors.ink,
  },
  saveLabel: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightSemibold,
    color: colors.accent,
    minHeight: 44,
    lineHeight: 44,
  },
  saveDisabled: {
    opacity: 0.45,
  },
  content: {
    paddingHorizontal: spacing.lg,
  },
  form: {
    gap: spacing.lg,
  },
  warn: {
    fontSize: typography.sizeSm,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  error: {
    fontSize: typography.sizeSm,
    color: colors.error,
    textAlign: 'center',
  },
});
