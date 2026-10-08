import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from './Button';
import { Text } from './Text';
import { colors, radius, spacing, typography } from '../theme/tokens';

type Props = {
  /** `dd/mm/yyyy`, or empty when unset. */
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  accessibilityLabel?: string;
  maximumDate?: Date;
};

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function formatDate(date: Date): string {
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

function parseDate(value: string): Date | null {
  const [day, month, year] = value.split('/').map((part) => Number.parseInt(part, 10));
  if (!day || !month) return null;
  const date = new Date(year || new Date().getFullYear(), month - 1, day);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function DateField({
  value,
  onChangeText,
  placeholder = 'Pick a date',
  accessibilityLabel,
  maximumDate,
}: Props) {
  const insets = useSafeAreaInsets();
  const [iosOpen, setIosOpen] = useState(false);
  const [iosDraft, setIosDraft] = useState<Date>(new Date());

  const initialDate = parseDate(value) ?? new Date();

  const open = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: initialDate,
        mode: 'date',
        maximumDate,
        neutralButton: value ? { label: 'Clear' } : undefined,
        onChange: (event: DateTimePickerEvent, date?: Date) => {
          if (event.type === 'neutralButtonPressed') {
            onChangeText('');
          } else if (event.type === 'set' && date) {
            onChangeText(formatDate(date));
          }
        },
      });
      return;
    }
    setIosDraft(initialDate);
    setIosOpen(true);
  };

  const confirmIos = () => {
    onChangeText(formatDate(iosDraft));
    setIosOpen(false);
  };

  const clearIos = () => {
    onChangeText('');
    setIosOpen(false);
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? placeholder}
        accessibilityValue={value ? { text: value } : undefined}
        onPress={open}
        style={({ pressed }) => [styles.root, pressed && styles.pressed]}
      >
        <Text style={[styles.value, !value && styles.placeholder]}>
          {value || placeholder}
        </Text>
        <View style={styles.calendarIcon} pointerEvents="none">
          <View style={styles.calendarTop} />
          <Text style={styles.calendarDay}>31</Text>
        </View>
      </Pressable>

      {Platform.OS === 'ios' ? (
        <Modal
          visible={iosOpen}
          transparent
          animationType="slide"
          onRequestClose={() => setIosOpen(false)}
        >
          <Pressable style={styles.backdrop} onPress={() => setIosOpen(false)} />
          <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.md }]}>
            <DateTimePicker
              value={iosDraft}
              mode="date"
              display="spinner"
              maximumDate={maximumDate}
              themeVariant="light"
              accentColor={colors.accent}
              textColor={colors.ink}
              onChange={(_event, date) => {
                if (date) setIosDraft(date);
              }}
            />
            <View style={styles.sheetActions}>
              {value ? (
                <Button label="Clear" variant="ghost" onPress={clearIos} style={styles.action} />
              ) : null}
              <Button label="Done" onPress={confirmIos} style={styles.action} />
            </View>
          </View>
        </Modal>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    minHeight: 52,
  },
  pressed: {
    opacity: 0.85,
  },
  value: {
    flex: 1,
    fontSize: typography.sizeMd,
    color: colors.ink,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  placeholder: {
    color: colors.muted,
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
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(28, 25, 20, 0.45)',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  sheetActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  action: {
    flex: 1,
  },
});
