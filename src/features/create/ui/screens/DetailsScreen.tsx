import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, View } from 'react-native';
import { Field } from '../../../../shared/ui/Field';
import { TextInput } from '../../../../shared/ui/TextInput';
import { useCreateDraftContext } from '../../application/CreateDraftContext';
import type { CreateStackParamList } from '../../../../shared/navigation/types';
import { Screen } from '../../../../shared/ui/Screen';
import { ScreenHeaderAction } from '../../../../shared/ui/ScreenHeaderAction';
import { colors, radius, spacing, typography } from '../../../../shared/theme/tokens';

type Props = NativeStackScreenProps<CreateStackParamList, 'Details'>;

const CREATE_STEPS = 4;
const MESSAGE_MAX = 280;

export function DetailsScreen({ navigation }: Props) {
  const { draft, setRecipientName, setMessage } = useCreateDraftContext();

  return (
    <Screen
      title="Details"
      subtitle="Who is this for?"
      step={{ current: 3, total: CREATE_STEPS }}
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
