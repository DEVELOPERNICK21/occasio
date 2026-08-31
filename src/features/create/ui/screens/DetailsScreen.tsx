import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, View } from 'react-native';
import { TextInput } from '../../../../shared/ui/TextInput';
import { useCreateDraftContext } from '../../application/CreateDraftContext';
import type { CreateStackParamList } from '../../../../shared/navigation/types';
import { Button } from '../../../../shared/ui/Button';
import { Screen } from '../../../../shared/ui/Screen';
import { colors, radius, spacing, typography } from '../../../../shared/theme/tokens';

type Props = NativeStackScreenProps<CreateStackParamList, 'Details'>;

export function DetailsScreen({ navigation }: Props) {
  const { draft, setRecipientName, setMessage } = useCreateDraftContext();

  return (
    <Screen
      title="Details"
      subtitle="Who is this for?"
      footer={
        <Button
          label="Preview"
          disabled={!draft.recipientName.trim()}
          onPress={() => navigation.navigate('Preview')}
        />
      }
    >
      <View style={styles.field}>
        <TextInput
          placeholder="Recipient name"
          placeholderTextColor={colors.muted}
          value={draft.recipientName}
          onChangeText={setRecipientName}
          style={styles.input}
        />
      </View>
      <View style={styles.field}>
        <TextInput
          placeholder="Your message"
          placeholderTextColor={colors.muted}
          value={draft.message}
          onChangeText={setMessage}
          multiline
          style={[styles.input, styles.textArea]}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  field: {
    marginTop: spacing.md,
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
    minHeight: 120,
    textAlignVertical: 'top',
  },
});
