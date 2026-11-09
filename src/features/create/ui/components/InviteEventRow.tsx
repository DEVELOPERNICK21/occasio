import { X } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../../../shared/theme/tokens';
import { DateField } from '../../../../shared/ui/DateField';
import { Text } from '../../../../shared/ui/Text';
import {
  INVITATION_LIMITS,
  clockLabel,
  fieldDateToIso,
  isoToFieldDate,
  shortDay,
  type InvitationEventDraft,
} from '../../domain/invitation';
import { InviteInput } from './InviteInput';

type Props = {
  index: number;
  event: InvitationEventDraft;
  /** The day of the whole invitation: an event with no day of its own happens then. */
  mainDay: string;
  minimumDate: Date;
  onChange: (patch: Partial<InvitationEventDraft>) => void;
  onRemove: () => void;
};

/** One part of the day: its name, its day and time, and where it is if that is not the main venue. */
export function InviteEventRow({ index, event, mainDay, minimumDate, onChange, onRemove }: Props) {
  const day = event.date || mainDay;
  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Text style={styles.number}>{`Event ${index + 1}`}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Remove ${event.title.trim() || `event ${index + 1}`}`}
          hitSlop={10}
          onPress={onRemove}
          style={styles.remove}
        >
          <X size={18} color={colors.muted} strokeWidth={2.2} absoluteStrokeWidth />
        </Pressable>
      </View>
      <InviteInput
        value={event.title}
        onChangeText={(title) => onChange({ title })}
        placeholder="Name, for example Sangeet"
        autoCapitalize="words"
        maxLength={INVITATION_LIMITS.eventTitle}
        accessibilityLabel={`Name of event ${index + 1}`}
      />
      <View style={styles.pair}>
        <View style={styles.half}>
          <DateField
            value={isoToFieldDate(day)}
            display={shortDay(day)}
            onChangeText={(text) => onChange({ date: fieldDateToIso(text) })}
            placeholder="Day"
            accessibilityLabel={`Day of event ${index + 1}`}
            minimumDate={minimumDate}
          />
        </View>
        <View style={styles.half}>
          <DateField
            mode="time"
            value={event.time}
            display={clockLabel(event.time)}
            onChangeText={(time) => onChange({ time })}
            placeholder="Time"
            accessibilityLabel={`Time of event ${index + 1}`}
          />
        </View>
      </View>
      <InviteInput
        value={event.venue}
        onChangeText={(venue) => onChange({ venue })}
        placeholder="Somewhere else? Name the place"
        maxLength={INVITATION_LIMITS.venue}
        accessibilityLabel={`Place of event ${index + 1}`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.sidebar,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  number: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightSemibold,
    color: colors.muted,
  },
  remove: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pair: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  half: {
    flex: 1,
  },
});
