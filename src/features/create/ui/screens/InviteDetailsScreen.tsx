import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, View } from 'react-native';
import { DateField } from '../../../../shared/ui/DateField';
import { Field } from '../../../../shared/ui/Field';
import { Screen } from '../../../../shared/ui/Screen';
import { ScreenHeaderAction } from '../../../../shared/ui/ScreenHeaderAction';
import { Text } from '../../../../shared/ui/Text';
import { colors, radius, spacing, typography } from '../../../../shared/theme/tokens';
import type { InviteStackParamList } from '../../../../shared/navigation/types';
import { useCreateDraftContext } from '../../application/CreateDraftContext';
import {
  DESIGN_INFO,
  INVITATION_LIMITS,
  OCCASION_INFO,
  detailsProblem,
  fieldDateToIso,
  isoToFieldDate,
  offersDesigns,
  shortDay,
} from '../../domain/invitation';
import { InviteExampleLink } from '../components/InviteExampleLink';
import { InviteInput } from '../components/InviteInput';
import { InviteProgress } from '../components/InviteProgress';

type Props = NativeStackScreenProps<InviteStackParamList, 'InviteDetails'>;

/** Step one: who it is for, which day and where. Everything else is optional. */
export function InviteDetailsScreen({ navigation }: Props) {
  const { draft, updateInvitation } = useCreateDraftContext();
  const invitation = draft.invitation;
  if (!invitation) {
    // Nothing started (for example the draft was cleared): back to the choice of occasion.
    return <MissingInvitation onBack={() => navigation.navigate('InviteHome')} />;
  }

  const info = OCCASION_INFO[invitation.occasion];
  const problem = detailsProblem(invitation);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <Screen
      title={`${info.label} invitation`}
      subtitle="Who it is for, which day and where."
      progress={<InviteProgress stage="day" />}
      onBack={() => navigation.goBack()}
      headerAction={<ScreenHeaderAction label="Next" disabled={problem !== null} onPress={() => navigation.navigate('InvitePlan')} />}
    >
      {offersDesigns(invitation.occasion) ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Design: ${DESIGN_INFO[invitation.design].label}. Change`}
          onPress={() => navigation.navigate('InviteDesign')}
          style={({ pressed }) => [styles.design, pressed && styles.pressed]}
        >
          <Text style={styles.designLabel}>Design</Text>
          <Text style={styles.designName}>{DESIGN_INFO[invitation.design].label}</Text>
          <Text style={styles.designChange}>Change</Text>
        </Pressable>
      ) : null}
      <InviteExampleLink occasion={invitation.occasion} design={invitation.design} />
      <View style={styles.form}>
        <Field label={info.nameLabel}>
          <InviteInput
            value={invitation.nameOne}
            onChangeText={(nameOne) => updateInvitation({ nameOne })}
            placeholder={info.namePlaceholder}
            autoCapitalize="words"
            maxLength={INVITATION_LIMITS.name}
          />
        </Field>
        {info.couple ? (
          <Field label={info.nameTwoLabel}>
            <InviteInput
              value={invitation.nameTwo}
              onChangeText={(nameTwo) => updateInvitation({ nameTwo })}
              placeholder={info.nameTwoPlaceholder}
              autoCapitalize="words"
              maxLength={INVITATION_LIMITS.name}
            />
          </Field>
        ) : null}
        <Field label="A line under the name" hint={info.taglineHint}>
          <InviteInput
            value={invitation.tagline}
            onChangeText={(tagline) => updateInvitation({ tagline })}
            placeholder={info.taglinePlaceholder}
            maxLength={INVITATION_LIMITS.tagline}
          />
        </Field>
        <Field label="Which day">
          <DateField
            value={isoToFieldDate(invitation.date)}
            display={shortDay(invitation.date)}
            onChangeText={(text) => updateInvitation({ date: fieldDateToIso(text) })}
            placeholder="Pick the day"
            accessibilityLabel="Pick the day"
            minimumDate={today}
          />
        </Field>
        <Field label="Venue">
          <InviteInput
            value={invitation.venueName}
            onChangeText={(venueName) => updateInvitation({ venueName })}
            placeholder="The Grand Courtyard"
            autoCapitalize="words"
            maxLength={INVITATION_LIMITS.venue}
          />
        </Field>
        <Field label="Address" hint="Guests get an Open in Maps button built from the venue and this address">
          <InviteInput
            value={invitation.venueAddress}
            onChangeText={(venueAddress) => updateInvitation({ venueAddress })}
            placeholder="Civil Lines, Jaipur"
            maxLength={INVITATION_LIMITS.address}
          />
        </Field>
      </View>
      {problem ? <Text style={styles.problem}>{problem}</Text> : null}
    </Screen>
  );
}

function MissingInvitation({ onBack }: { onBack: () => void }) {
  return (
    <Screen title="Invitations" subtitle="Choose what you are inviting people to." onBack={onBack}>
      <Text style={styles.problem}>This invitation was cleared. Go back and start again.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  design: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.sidebar,
  },
  pressed: {
    opacity: 0.85,
  },
  designLabel: {
    fontSize: typography.sizeXs,
    color: colors.muted,
  },
  designName: {
    flex: 1,
    fontSize: typography.sizeSm,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
  },
  designChange: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightSemibold,
    color: colors.accentHover,
  },
  form: {
    marginTop: spacing.md,
    gap: spacing.lg,
  },
  problem: {
    marginTop: spacing.lg,
    fontSize: typography.sizeSm,
    color: colors.muted,
  },
});
