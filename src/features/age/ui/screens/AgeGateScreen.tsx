import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../../../shared/ui/Button';
import { PipFriend } from '../../../../shared/ui/PipFriend';
import { Text } from '../../../../shared/ui/Text';
import { TextInput } from '../../../../shared/ui/TextInput';
import { colors, radius, spacing, typography } from '../../../../shared/theme/tokens';
import { AGE_COPY, type DobInput } from '../../domain/ageGate';

type Props = {
  error: string | null;
  isChecking: boolean;
  onSubmit: (input: DobInput) => void;
};

/** Neutral on purpose: it asks for a date, and does not say which age is the cut-off. */
export function AgeGateScreen({ error, isChecking, onSubmit }: Props) {
  const insets = useSafeAreaInsets();
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const monthRef = useRef<import('react-native').TextInput>(null);
  const yearRef = useRef<import('react-native').TextInput>(null);

  const digits = (value: string, max: number) => value.replace(/\D/g, '').slice(0, max);
  const ready = day.length > 0 && month.length > 0 && year.length === 4;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.lg },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.pip}>
          <PipFriend spot="ageGate" size={120} />
        </View>
        <View style={styles.heading}>
          <Text style={styles.title} accessibilityRole="header">
            {AGE_COPY.title}
          </Text>
          <Text style={styles.body}>{AGE_COPY.body}</Text>
        </View>

        <View style={styles.row}>
          <View style={[styles.cell, styles.cellSmall]}>
            <Text style={styles.label}>Day</Text>
            <TextInput
              accessibilityLabel="Day of birth"
              style={styles.input}
              value={day}
              keyboardType="number-pad"
              inputMode="numeric"
              maxLength={2}
              placeholder="DD"
              placeholderTextColor={colors.muted}
              returnKeyType="next"
              onChangeText={(v) => {
                const next = digits(v, 2);
                setDay(next);
                if (next.length === 2) monthRef.current?.focus();
              }}
            />
          </View>
          <View style={[styles.cell, styles.cellSmall]}>
            <Text style={styles.label}>Month</Text>
            <TextInput
              ref={monthRef}
              accessibilityLabel="Month of birth"
              style={styles.input}
              value={month}
              keyboardType="number-pad"
              inputMode="numeric"
              maxLength={2}
              placeholder="MM"
              placeholderTextColor={colors.muted}
              returnKeyType="next"
              onChangeText={(v) => {
                const next = digits(v, 2);
                setMonth(next);
                if (next.length === 2) yearRef.current?.focus();
              }}
            />
          </View>
          <View style={[styles.cell, styles.cellWide]}>
            <Text style={styles.label}>Year</Text>
            <TextInput
              ref={yearRef}
              accessibilityLabel="Year of birth"
              style={styles.input}
              value={year}
              keyboardType="number-pad"
              inputMode="numeric"
              maxLength={4}
              placeholder="YYYY"
              placeholderTextColor={colors.muted}
              returnKeyType="done"
              onChangeText={(v) => setYear(digits(v, 4))}
              onSubmitEditing={() => ready && onSubmit({ day, month, year })}
            />
          </View>
        </View>

        {error ? (
          <Text style={styles.error} accessibilityLiveRegion="polite">
            {error}
          </Text>
        ) : null}

        <Button
          label="Continue"
          disabled={!ready}
          loading={isChecking}
          onPress={() => onSubmit({ day, month, year })}
        />
        <Text style={styles.note}>Your birthday is checked and then discarded. Only the result is kept on your phone.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { flexGrow: 1, paddingHorizontal: spacing.lg, gap: spacing.lg },
  // Room above Pip for the line he says when tapped.
  pip: { alignItems: 'center', marginTop: spacing.xl },
  heading: { gap: spacing.sm },
  title: {
    fontSize: typography.sizeXl,
    lineHeight: typography.sizeXl * 1.15,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
  },
  body: {
    fontSize: typography.sizeMd,
    lineHeight: typography.sizeMd * 1.45,
    color: colors.inkSoft,
  },
  row: { flexDirection: 'row', gap: spacing.sm },
  cell: { gap: spacing.xs },
  cellSmall: { flex: 1 },
  cellWide: { flex: 1.6 },
  label: { fontSize: typography.sizeSm, fontWeight: typography.weightMedium, color: colors.inkSoft },
  input: {
    minHeight: 52,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    fontSize: typography.sizeLg,
    color: colors.ink,
    textAlign: 'center',
  },
  error: { fontSize: typography.sizeSm, color: colors.error },
  note: {
    fontSize: typography.sizeXs,
    lineHeight: typography.sizeXs * 1.5,
    color: colors.muted,
    textAlign: 'center',
  },
});
