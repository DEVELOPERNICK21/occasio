import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, View } from 'react-native';
import { DateField } from '../../../../shared/ui/DateField';
import { Field } from '../../../../shared/ui/Field';
import { Screen } from '../../../../shared/ui/Screen';
import { ScreenHeaderAction } from '../../../../shared/ui/ScreenHeaderAction';
import { Text } from '../../../../shared/ui/Text';
import { Toggle } from '../../../../shared/ui/Toggle';
import { colors, spacing, typography } from '../../../../shared/theme/tokens';
import type { InviteStackParamList } from '../../../../shared/navigation/types';
import { useCreateDraftContext } from '../../application/CreateDraftContext';
import {
  INVITATION_LIMITS,
  OCCASION_INFO,
  defaultHostLine,
  fieldDateToIso,
  isoToFieldDate,
  replyProblem,
  shortDay,
} from '../../domain/invitation';
import { InviteInput } from '../components/InviteInput';
import { InviteProgress } from '../components/InviteProgress';

type Props = NativeStackScreenProps<InviteStackParamList, 'InviteReply'>;

const NOTE_MAX = 280;

/** Step three: where replies go, a line to open with, and a note for the guests. All of it is optional. */
export function InviteReplyScreen({ navigation }: Props) {
  const { draft, updateInvitation, setMessage } = useCreateDraftContext();
  const invitation = draft.invitation;
  if (!invitation) {
    return (
      <Screen title="Invitations" onBack={() => navigation.navigate('InviteHome')}>
        <Text style={styles.problem}>This invitation was cleared. Go back and start again.</Text>
      </Screen>
    );
  }

  const info = OCCASION_INFO[invitation.occasion];
  const problem = replyProblem(invitation);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lastDay = invitation.date ? new Date(`${invitation.date}T00:00:00`) : undefined;

  return (
    <Screen
      title="Replies"
      subtitle="How guests answer, and a word from you."
      progress={<InviteProgress stage="reply" />}
      onBack={() => navigation.goBack()}
      headerAction={<ScreenHeaderAction label="Next" disabled={problem !== null} onPress={() => navigation.navigate('AddPhotos')} />}
    >
      <View style={styles.form}>
        <Field
          label="WhatsApp number for replies"
          hint="Guests tap once to send you their answer. Leave it empty and the page shows no reply button."
        >
          <View style={styles.phoneRow}>
            <View style={styles.country}>
              <Text style={styles.plus}>+</Text>
              <InviteInput
                value={invitation.rsvpCountry}
                onChangeText={(text) => updateInvitation({ rsvpCountry: text.replace(/\D/g, '').slice(0, 4) })}
                keyboardType="number-pad"
                maxLength={4}
                accessibilityLabel="Country code"
                style={styles.countryInput}
              />
            </View>
            <InviteInput
              value={invitation.rsvpPhone}
              onChangeText={(rsvpPhone) => updateInvitation({ rsvpPhone: rsvpPhone.replace(/[^\d\s]/g, '').slice(0, 16) })}
              keyboardType="phone-pad"
              placeholder="98765 43210"
              accessibilityLabel="WhatsApp number"
              style={styles.phoneInput}
            />
          </View>
        </Field>

        <Field label="Please reply by" hint="Optional. Guests see it above the reply.">
          <DateField
            value={isoToFieldDate(invitation.rsvpBy)}
            display={shortDay(invitation.rsvpBy)}
            onChangeText={(text) => updateInvitation({ rsvpBy: fieldDateToIso(text) })}
            placeholder="Pick a day"
            accessibilityLabel="Reply by day"
            minimumDate={today}
            maximumDate={lastDay && lastDay >= today ? lastDay : undefined}
          />
        </Field>

        <Field label="Line above the names" hint={`Optional. Without one the page says “${defaultHostLine(invitation.occasion)}”.`}>
          <InviteInput
            value={invitation.hostLine}
            onChangeText={(hostLine) => updateInvitation({ hostLine })}
            placeholder={defaultHostLine(invitation.occasion)}
            maxLength={INVITATION_LIMITS.hostLine}
          />
        </Field>

        {info.offersBlessing ? (
          <View style={styles.toggleRow}>
            <View style={styles.toggleCopy}>
              <Text style={styles.toggleTitle}>Begin with a blessing</Text>
              <Text style={styles.toggleHint}>Shows the Ganesh verse in Devanagari at the top of the page.</Text>
            </View>
            <Toggle
              value={invitation.blessing === 'ganesh'}
              onValueChange={(on) => updateInvitation({ blessing: on ? 'ganesh' : 'none' })}
            />
          </View>
        ) : null}

        <Field label="A note for your guests" hint={`${draft.message.length}/${NOTE_MAX} characters. Optional.`}>
          <InviteInput
            value={draft.message}
            onChangeText={(text) => setMessage(text.slice(0, NOTE_MAX))}
            placeholder="We would be honoured to have you with us."
            multiline
            style={styles.note}
          />
        </Field>
      </View>
      {problem ? <Text style={styles.problem}>{problem}</Text> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: {
    marginTop: spacing.md,
    gap: spacing.lg,
  },
  phoneRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  country: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  plus: {
    fontSize: typography.sizeMd,
    color: colors.muted,
  },
  countryInput: {
    width: 64,
    textAlign: 'center',
  },
  phoneInput: {
    flex: 1,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  toggleCopy: {
    flex: 1,
    gap: 4,
  },
  toggleTitle: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
  },
  toggleHint: {
    fontSize: typography.sizeSm,
    color: colors.muted,
  },
  note: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
  problem: {
    marginTop: spacing.lg,
    fontSize: typography.sizeSm,
    color: colors.error,
  },
});
