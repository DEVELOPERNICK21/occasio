import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, View } from 'react-native';
import { Button } from '../../../../shared/ui/Button';
import { Screen } from '../../../../shared/ui/Screen';
import { Text } from '../../../../shared/ui/Text';
import { colors, radius, spacing, typography } from '../../../../shared/theme/tokens';
import type { InviteStackParamList } from '../../../../shared/navigation/types';
import { useCreateDraftContext } from '../../application/CreateDraftContext';
import {
  INVITATION_OCCASIONS,
  INVITATION_TEMPLATE,
  OCCASION_INFO,
  invitationSummaryLine,
  offersDesigns,
  invitationTitle,
} from '../../domain/invitation';
import { InviteOccasionTile } from '../components/InviteOccasionTile';

type Props = NativeStackScreenProps<InviteStackParamList, 'InviteHome'>;

/** The start of the Invitations tab: pick what you are inviting people to, or carry on with one you started. */
export function InviteHomeScreen({ navigation }: Props) {
  const { draft, startInvitation, reset } = useCreateDraftContext();
  const unfinished =
    draft.templateType === INVITATION_TEMPLATE && draft.invitation && !draft.editingCreationId ? draft.invitation : null;
  const unfinishedTitle = unfinished ? invitationTitle(unfinished) : '';

  return (
    <Screen
      title="Invitations"
      subtitle="One link for every guest, with the plan of the day and a reply on WhatsApp."
    >
      {unfinished ? (
        <View style={styles.resume}>
          <Text style={styles.resumeKicker}>{`Your ${OCCASION_INFO[unfinished.occasion].label.toLowerCase()} invitation`}</Text>
          <Text style={styles.resumeTitle}>{unfinishedTitle || 'Not named yet'}</Text>
          <Text style={styles.resumeLine}>{invitationSummaryLine(unfinished)}</Text>
          <View style={styles.resumeActions}>
            <Button label="Carry on" onPress={() => navigation.navigate('InviteDetails')} style={styles.resumeButton} />
            <Button label="Start over" variant="ghost" onPress={reset} style={styles.resumeButton} />
          </View>
        </View>
      ) : null}

      <Text style={styles.sectionLabel}>{unfinished ? 'Or start a new one' : 'What are you inviting people to?'}</Text>
      <View style={styles.grid}>
        {INVITATION_OCCASIONS.map((occasion) => (
          <InviteOccasionTile
            key={occasion}
            occasion={occasion}
            onPress={() => {
              startInvitation(occasion);
              // A ceremony chooses how it looks first; every other occasion has the one look.
              navigation.navigate(offersDesigns(occasion) ? 'InviteDesign' : 'InviteDetails');
            }}
          />
        ))}
      </View>
      <Text style={styles.note}>
        Guests open one page with a countdown, the plan, the place and a reply. Nothing they type is stored by Occasio.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  resume: {
    marginTop: spacing.md,
    padding: spacing.md,
    gap: spacing.xs,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.accent,
    backgroundColor: colors.sidebar,
  },
  resumeKicker: {
    fontSize: typography.sizeXs,
    color: colors.muted,
  },
  resumeTitle: {
    fontSize: typography.sizeLg,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
  },
  resumeLine: {
    fontSize: typography.sizeSm,
    color: colors.inkSoft,
  },
  resumeActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  resumeButton: {
    flex: 1,
  },
  sectionLabel: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    fontSize: typography.sizeSm,
    fontWeight: typography.weightSemibold,
    color: colors.inkSoft,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  note: {
    marginTop: spacing.lg,
    fontSize: typography.sizeSm,
    lineHeight: typography.sizeSm * 1.45,
    color: colors.muted,
  },
});
