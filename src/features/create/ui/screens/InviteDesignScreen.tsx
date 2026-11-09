import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, View } from 'react-native';
import { Button } from '../../../../shared/ui/Button';
import { Screen } from '../../../../shared/ui/Screen';
import { ScreenActions } from '../../../../shared/ui/ScreenActions';
import { Text } from '../../../../shared/ui/Text';
import { colors, spacing, typography } from '../../../../shared/theme/tokens';
import type { InviteStackParamList } from '../../../../shared/navigation/types';
import { useCreateDraftContext } from '../../application/CreateDraftContext';
import { INVITATION_DESIGNS, OCCASION_INFO } from '../../domain/invitation';
import { InviteDesignCard } from '../components/InviteDesignCard';

type Props = NativeStackScreenProps<InviteStackParamList, 'InviteDesign'>;

/** Before the details, for a wedding, engagement or anniversary: which of the three designs. */
export function InviteDesignScreen({ navigation }: Props) {
  const { draft, updateInvitation } = useCreateDraftContext();
  const invitation = draft.invitation;
  if (!invitation) {
    return (
      <Screen title="Invitations" onBack={() => navigation.navigate('InviteHome')}>
        <Text style={styles.empty}>This invitation was cleared. Go back and start again.</Text>
      </Screen>
    );
  }

  return (
    <Screen
      title="Choose a design"
      subtitle={`Guests get the same plan for your ${OCCASION_INFO[invitation.occasion].label.toLowerCase()} in the look you pick. Open an example to see it move.`}
      onBack={() => navigation.goBack()}
    >
      <View style={styles.list} accessibilityRole="radiogroup">
        {INVITATION_DESIGNS.map((design) => (
          <InviteDesignCard
            key={design}
            design={design}
            occasion={invitation.occasion}
            selected={invitation.design === design}
            onSelect={() => updateInvitation({ design })}
          />
        ))}
      </View>
      <ScreenActions>
        <Button label="Continue" onPress={() => navigation.navigate('InviteDetails')} />
      </ScreenActions>
      <Text style={styles.note}>You can change the design later from the next screen.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    marginTop: spacing.md,
    gap: spacing.md,
  },
  note: {
    marginTop: spacing.md,
    fontSize: typography.sizeSm,
    color: colors.muted,
    textAlign: 'center',
  },
  empty: {
    marginTop: spacing.lg,
    fontSize: typography.sizeSm,
    color: colors.muted,
  },
});
