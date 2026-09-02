import { StyleSheet, View } from 'react-native';
import { Text } from './Text';
import { TextInput } from './TextInput';
import { colors, radius, spacing, typography } from '../theme/tokens';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
};

export function SearchPill({ value, onChangeText, placeholder }: Props) {
  return (
    <View style={styles.root}>
      <Text style={styles.icon}>⌕</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        style={styles.input}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    backgroundColor: colors.sidebar,
    borderWidth: 1,
    borderColor: colors.border,
  },
  icon: {
    fontSize: typography.sizeMd,
    color: colors.muted,
    lineHeight: typography.sizeMd,
  },
  input: {
    flex: 1,
    fontSize: typography.sizeSm,
    color: colors.ink,
    paddingVertical: spacing.sm,
  },
});
