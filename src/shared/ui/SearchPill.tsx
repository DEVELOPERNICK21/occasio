import { Pressable, StyleSheet, View } from 'react-native';
import { Search, X } from 'lucide-react-native';
import { TextInput } from './TextInput';
import { colors, radius, spacing, typography } from '../theme/tokens';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
};

const ICON_SIZE = 18;

export function SearchPill({ value, onChangeText, placeholder }: Props) {
  return (
    <View style={styles.root}>
      <Search size={ICON_SIZE} color={colors.muted} strokeWidth={2} absoluteStrokeWidth />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        style={styles.input}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        accessibilityLabel={placeholder}
      />
      {value.length > 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          onPress={() => onChangeText('')}
          hitSlop={spacing.sm}
          style={styles.clear}
        >
          <X size={14} color={colors.white} strokeWidth={2.4} absoluteStrokeWidth />
        </Pressable>
      ) : null}
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
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: {
    flex: 1,
    fontSize: typography.sizeSm,
    color: colors.ink,
    paddingVertical: spacing.sm,
  },
  clear: {
    width: 20,
    height: 20,
    borderRadius: radius.full,
    backgroundColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
