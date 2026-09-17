import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Field } from '../../../../shared/ui/Field';
import { TextInput } from '../../../../shared/ui/TextInput';
import { useAuth } from '../../../auth/application/useAuth';
import { useCreateDraftContext } from '../../application/CreateDraftContext';
import type { CreateStackParamList } from '../../../../shared/navigation/types';
import { Screen } from '../../../../shared/ui/Screen';
import { ScreenHeaderAction } from '../../../../shared/ui/ScreenHeaderAction';
import { colors, radius, spacing, typography } from '../../../../shared/theme/tokens';
import { getCreateStep } from '../createSteps';

type Props = NativeStackScreenProps<CreateStackParamList, 'Details'>;

const MESSAGE_MAX = 280;

export function DetailsScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { draft, setRecipientName, setFromName, setMessage } =
    useCreateDraftContext();

  useEffect(() => {
    if (draft.fromName.trim()) return;
    const accountName = user?.displayName?.trim();
    if (accountName) {
      setFromName(accountName);
    }
  }, [draft.fromName, setFromName, user?.displayName]);

  return (
    <Screen
      title="Your words"
      subtitle="Their name and a line from you."
      step={getCreateStep('details', !draft.audience)}
      onBack={() => navigation.goBack()}
      headerAction={
        <ScreenHeaderAction
          label="Preview"
          disabled={!draft.recipientName.trim()}
          onPress={() => navigation.navigate('Preview')}
        />
      }
    >
      <View style={styles.form}>
        <Field label="To">
          <TextInput
            placeholder="Recipient name"
            placeholderTextColor={colors.muted}
            value={draft.recipientName}
            onChangeText={setRecipientName}
            style={styles.input}
            autoCapitalize="words"
          />
        </Field>
        <Field label="From" hint="Signs the card so they know who sent it">
          <TextInput
            placeholder="Your name"
            placeholderTextColor={colors.muted}
            value={draft.fromName}
            onChangeText={setFromName}
            style={styles.input}
            autoCapitalize="words"
          />
        </Field>
        <Field
          label="Message"
          hint={`${draft.message.length}/${MESSAGE_MAX} characters`}
        >
          <TextInput
            placeholder="Write something personal"
            placeholderTextColor={colors.muted}
            value={draft.message}
            onChangeText={(text) => setMessage(text.slice(0, MESSAGE_MAX))}
            multiline
            style={[styles.input, styles.textArea]}
          />
        </Field>
      </View>
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
  textArea: {
    minHeight: 132,
    textAlignVertical: 'top',
  },
});
