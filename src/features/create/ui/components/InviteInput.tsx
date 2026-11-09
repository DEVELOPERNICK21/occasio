import { forwardRef } from 'react';
import { StyleSheet, type TextInputProps } from 'react-native';
import { colors, radius, spacing, typography } from '../../../../shared/theme/tokens';
import { TextInput, type TextInputHandle } from '../../../../shared/ui/TextInput';

/** The one text box the invitation steps share, so every field looks and behaves the same. */
export const InviteInput = forwardRef<TextInputHandle, TextInputProps>(function InviteInputBox({ style, ...props }, ref) {
  return <TextInput ref={ref} placeholderTextColor={colors.muted} style={[styles.input, style]} {...props} />;
});

const styles = StyleSheet.create({
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
});
