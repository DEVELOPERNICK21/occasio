import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { Clock } from './icons/lucide';
import { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from './Button';
import { Text } from './Text';
import { colors, overlay, radius, spacing, typography } from '../theme/tokens';

type Props = {
  /** `dd/mm/yyyy` (or `HH:MM`, 24 hours, in time mode), or empty when unset. */
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  accessibilityLabel?: string;
  maximumDate?: Date;
  /** The earliest day that can be picked. */
  minimumDate?: Date;
  /** Pick a day (the default) or a time of day. */
  mode?: 'date' | 'time';
  /** What to show in place of `value`, for example "23 Feb 2027" or "6:30 PM". */
  display?: string;
};

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function formatDate(date: Date): string {
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

function formatTime(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function parseDate(value: string): Date | null {
  const [day, month, year] = value.split('/').map((part) => Number.parseInt(part, 10));
  if (!day || !month) return null;
  const date = new Date(year || new Date().getFullYear(), month - 1, day);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseTime(value: string): Date | null {
  const [hours, minutes] = value.split(':').map((part) => Number.parseInt(part, 10));
  if (hours === undefined || minutes === undefined || Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

export function DateField({
  value,
  onChangeText,
  placeholder = 'Pick a date',
  accessibilityLabel,
  maximumDate,
  minimumDate,
  mode = 'date',
  display,
}: Props) {
  const insets = useSafeAreaInsets();
  const [iosOpen, setIosOpen] = useState(false);
  const [iosDraft, setIosDraft] = useState<Date>(new Date());

  const initialDate = (mode === 'time' ? parseTime(value) : parseDate(value)) ?? new Date();
  const format = mode === 'time' ? formatTime : formatDate;

  const open = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: initialDate,
        mode,
        maximumDate,
        minimumDate,
        neutralButton: value ? { label: 'Clear' } : undefined,
        onChange: (event: DateTimePickerEvent, date?: Date) => {
          if (event.type === 'neutralButtonPressed') {
            onChangeText('');
          } else if (event.type === 'set' && date) {
            onChangeText(format(date));
          }
        },
      });
      return;
    }
    setIosDraft(initialDate);
    setIosOpen(true);
  };

  const confirmIos = () => {
    onChangeText(format(iosDraft));
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
          {value ? (display ?? value) : placeholder}
        </Text>
        {mode === 'time' ? (
          <View style={[styles.calendarIcon, styles.clockIcon]} pointerEvents="none">
            <Clock size={16} color={colors.accentHover} strokeWidth={2.2} absoluteStrokeWidth />
          </View>
        ) : (
          <View style={styles.calendarIcon} pointerEvents="none">
            <View style={styles.calendarTop} />
            <Text style={styles.calendarDay}>31</Text>
          </View>
        )}
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
              mode={mode}
              display="spinner"
              maximumDate={maximumDate}
              minimumDate={minimumDate}
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
  clockIcon: {
    alignItems: 'center',
    justifyContent: 'center',
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
    backgroundColor: overlay.scrim,
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
