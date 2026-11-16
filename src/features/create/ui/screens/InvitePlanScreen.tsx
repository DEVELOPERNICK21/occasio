import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Plus } from '../../../../shared/ui/icons/lucide';
import { Button } from '../../../../shared/ui/Button';
import { Field } from '../../../../shared/ui/Field';
import { Screen } from '../../../../shared/ui/Screen';
import { ScreenHeaderAction } from '../../../../shared/ui/ScreenHeaderAction';
import { Text } from '../../../../shared/ui/Text';
import { colors, radius, spacing, typography } from '../../../../shared/theme/tokens';
import type { InviteStackParamList } from '../../../../shared/navigation/types';
import { useCreateDraftContext } from '../../application/CreateDraftContext';
import {
  INVITATION_LIMITS,
  MAX_INVITATION_EVENTS,
  OCCASION_INFO,
  planProblem,
  type InvitationEventDraft,
} from '../../domain/invitation';
import { InviteEventRow } from '../components/InviteEventRow';
import { InviteInput } from '../components/InviteInput';
import { InviteProgress } from '../components/InviteProgress';

type Props = NativeStackScreenProps<InviteStackParamList, 'InvitePlan'>;

/** Step two: the parts of the day. Guests light a lamp or collect a star for each one. */
export function InvitePlanScreen({ navigation }: Props) {
  const { draft, updateInvitation } = useCreateDraftContext();
  const invitation = draft.invitation;
  if (!invitation) {
    return (
      <Screen title="Invitations" onBack={() => navigation.navigate('InviteHome')}>
        <Text style={styles.empty}>This invitation was cleared. Go back and start again.</Text>
      </Screen>
    );
  }

  const info = OCCASION_INFO[invitation.occasion];
  const problem = planProblem(invitation);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const setEvents = (events: InvitationEventDraft[]) => updateInvitation({ events });
  const addEvent = (title = '') =>
    setEvents([...invitation.events, { title, date: '', time: '', venue: '' }]);
  const changeEvent = (index: number, patch: Partial<InvitationEventDraft>) =>
    setEvents(invitation.events.map((event, i) => (i === index ? { ...event, ...patch } : event)));
  const removeEvent = (index: number) => setEvents(invitation.events.filter((_, i) => i !== index));

  const used = new Set(invitation.events.map((event) => event.title.trim().toLowerCase()));
  const suggestions = info.eventSuggestions.filter((name) => !used.has(name.toLowerCase()));
  const canAdd = invitation.events.length < MAX_INVITATION_EVENTS;

  return (
    <Screen
      title="The plan"
      subtitle="List each part of the day. Skip this if it is one gathering."
      progress={<InviteProgress stage="plan" />}
      onBack={() => navigation.goBack()}
      headerAction={<ScreenHeaderAction label="Next" disabled={problem !== null} onPress={() => navigation.navigate('InviteReply')} />}
    >
      {canAdd && suggestions.length > 0 ? (
        <View style={styles.suggest}>
          <Text style={styles.suggestLabel}>Add with one tap</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.chips}>
            {suggestions.map((name) => (
              <Pressable
                key={name}
                accessibilityRole="button"
                accessibilityLabel={`Add ${name}`}
                onPress={() => addEvent(name)}
                style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
              >
                <Plus size={14} color={colors.accentHover} strokeWidth={2.4} absoluteStrokeWidth />
                <Text style={styles.chipText}>{name}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}

      <View style={styles.list}>
        {invitation.events.map((event, index) => (
          <InviteEventRow
            key={index}
            index={index}
            event={event}
            mainDay={invitation.date}
            minimumDate={today}
            onChange={(patch) => changeEvent(index, patch)}
            onRemove={() => removeEvent(index)}
          />
        ))}
      </View>

      {canAdd ? (
        <Button
          label={invitation.events.length === 0 ? 'Add the first event' : 'Add another event'}
          variant="secondary"
          onPress={() => addEvent()}
          style={styles.add}
        />
      ) : (
        <Text style={styles.note}>{`That is the most an invitation can hold: ${MAX_INVITATION_EVENTS} events.`}</Text>
      )}
      {problem ? <Text style={styles.note}>{problem}</Text> : null}

      <View style={styles.dress}>
        <Field label="Dress code" hint="Optional">
          <InviteInput
            value={invitation.dressCode}
            onChangeText={(dressCode) => updateInvitation({ dressCode })}
            placeholder="Festive Indian"
            maxLength={INVITATION_LIMITS.dressCode}
          />
        </Field>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  suggest: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  suggestLabel: {
    fontSize: typography.sizeSm,
    color: colors.muted,
  },
  chips: {
    gap: spacing.sm,
    paddingRight: spacing.md,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipPressed: {
    opacity: 0.8,
  },
  chipText: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightMedium,
    color: colors.ink,
  },
  list: {
    marginTop: spacing.md,
    gap: spacing.md,
  },
  add: {
    marginTop: spacing.md,
  },
  note: {
    marginTop: spacing.md,
    fontSize: typography.sizeSm,
    color: colors.muted,
  },
  dress: {
    marginTop: spacing.xl,
  },
  empty: {
    marginTop: spacing.lg,
    fontSize: typography.sizeSm,
    color: colors.muted,
  },
});
