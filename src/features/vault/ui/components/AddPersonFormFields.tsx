import { StyleSheet } from 'react-native';
import { TextInput } from '../../../../shared/ui/TextInput';
import { colors, radius, spacing, typography } from '../../../../shared/theme/tokens';

export function AddPersonNameField({
  value,
  onChangeText,
}: {
  value: string;
  onChangeText: (text: string) => void;
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder="Who are we celebrating?"
      placeholderTextColor={colors.muted}
      autoCapitalize="words"
      style={styles.nameInput}
    />
  );
}

export function AddPersonEmailField({
  value,
  onChangeText,
}: {
  value: string;
  onChangeText: (text: string) => void;
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder="Their email (optional)"
      placeholderTextColor={colors.muted}
      keyboardType="email-address"
      autoCapitalize="none"
      autoCorrect={false}
      style={styles.nameInput}
    />
  );
}

const styles = StyleSheet.create({
  nameInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    minHeight: 52,
    paddingHorizontal: spacing.md,
    fontSize: typography.sizeMd,
    color: colors.ink,
    paddingVertical: spacing.md,
  },
});
