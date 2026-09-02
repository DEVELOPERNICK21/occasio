import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../../../../shared/ui/Text';
import { TextInput } from '../../../../shared/ui/TextInput';
import { colors, radius, spacing, typography } from '../../../../shared/theme/tokens';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
};

export function BirthdayDateField({ value, onChangeText }: Props) {
  return (
    <View style={styles.root}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="dd/mm/yyyy"
        placeholderTextColor={colors.muted}
        keyboardType="numbers-and-punctuation"
        style={styles.input}
      />
      <View style={styles.calendarIcon} pointerEvents="none">
        <View style={styles.calendarTop} />
        <Text style={styles.calendarDay}>31</Text>
      </View>
    </View>
  );
}

export function OccasionTypeField() {
  return (
    <View style={styles.select}>
      <Text style={styles.selectValue}>Birthday</Text>
      <Text style={styles.chevron}>⌄</Text>
    </View>
  );
}

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

const fieldBase = {
  backgroundColor: colors.surface,
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: radius.lg,
  minHeight: 52,
  paddingHorizontal: spacing.md,
  fontSize: typography.sizeMd,
  color: colors.ink,
} as const;

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    ...fieldBase,
    paddingHorizontal: 0,
  },
  input: {
    flex: 1,
    fontSize: typography.sizeMd,
    color: colors.ink,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  calendarIcon: {
    width: 28,
    height: 28,
    marginRight: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.sidebar,
    alignItems: 'center',
    overflow: 'hidden',
  },
  calendarTop: {
    width: '100%',
    height: 6,
    backgroundColor: colors.accent,
  },
  calendarDay: {
    fontSize: 9,
    fontWeight: typography.weightSemibold,
    color: colors.inkSoft,
    marginTop: 2,
  },
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...fieldBase,
    paddingVertical: spacing.md,
  },
  selectValue: {
    fontSize: typography.sizeMd,
    color: colors.ink,
  },
  chevron: {
    fontSize: typography.sizeLg,
    lineHeight: typography.sizeLg,
    color: colors.muted,
    marginTop: -2,
  },
  nameInput: {
    ...fieldBase,
    paddingVertical: spacing.md,
  },
});
