import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { Text } from '../../../../shared/ui/Text';
import { Button } from '../../../../shared/ui/Button';
import { Screen } from '../../../../shared/ui/Screen';
import { ScreenActions } from '../../../../shared/ui/ScreenActions';
import { PersonDetailSkeleton } from '../../../../shared/ui/SkeletonLayouts';
import { colors, radius, spacing, typography } from '../../../../shared/theme/tokens';
import type { VaultStackParamList } from '../../../../shared/navigation/types';
import { useSubscription } from '../../../billing/application/useSubscription';
import { useDeletePerson } from '../../application/useDeletePerson';
import { useToggleAutoSend } from '../../application/useToggleAutoSend';
import { useUpdateAutoSendPack } from '../../application/useUpdateAutoSendPack';
import { useVaultPeople } from '../../application/useVaultPeople';
import {
  daysUntilPersonDate,
  formatPersonDate,
} from '../../domain/personRules';
import { relationshipLabel } from '../../domain/relationshipTypes';
import type { AutoSendPack, OccasionType } from '../../domain/types';
import { AddPersonAutoSendCard } from '../components/AddPersonAutoSendCard';
import { AutoSendPackCard } from '../components/AutoSendPackCard';

type Props = NativeStackScreenProps<VaultStackParamList, 'PersonDetail'>;

const EMPTY_PACK: AutoSendPack = {
  preferredTemplateId: null,
  preferredTemplateType: null,
  photoRefs: [],
  defaultMessage: '',
  fromName: null,
};

export function PersonDetailScreen({ navigation, route }: Props) {
  const { people, isLoading } = useVaultPeople(true);
  const { remove, isDeleting, error: deleteError } = useDeletePerson();
  const { tier } = useSubscription();
  const {
    toggle,
    error: toggleError,
    autoSendAllowed,
    pendingId,
  } = useToggleAutoSend(tier);
  const {
    savePack,
    isSaving: isSavingPack,
    error: packError,
  } = useUpdateAutoSendPack();

  const person = useMemo(
    () => people.find((item) => item.id === route.params.personId),
    [people, route.params.personId],
  );

  const [editingPack, setEditingPack] = useState(false);
  const [packMessage, setPackMessage] = useState('');

  if (isLoading) {
    return (
      <Screen title="Person" scroll={false}>
        <PersonDetailSkeleton />
      </Screen>
    );
  }

  if (!person) {
    return (
      <Screen title="Person">
        <Text style={styles.muted}>This person could not be found.</Text>
        <ScreenActions align="start">
          <Button label="Back" variant="ghost" onPress={() => navigation.goBack()} />
        </ScreenActions>
      </Screen>
    );
  }

  const daysUntilBirthday = person.birthday
    ? daysUntilPersonDate(person.birthday)
    : null;
  const daysUntilAnniversary = person.anniversary
    ? daysUntilPersonDate(person.anniversary)
    : null;
  const error = deleteError ?? toggleError ?? packError;

  const handleArmToggle = (occasion: OccasionType, current: boolean) => {
    void toggle(person.id, occasion, !current);
  };

  const handleEditPack = () => {
    setPackMessage(person.pack?.defaultMessage ?? '');
    setEditingPack(true);
  };

  const handleSavePack = async () => {
    const nextPack: AutoSendPack = {
      ...(person.pack ?? EMPTY_PACK),
      defaultMessage: packMessage.trim(),
    };
    const saved = await savePack(person.id, nextPack);
    if (saved) {
      setEditingPack(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Remove from Vault?',
      `${person.personName} will be removed. Auto-send for this person will stop.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              const deleted = await remove(person.id);
              if (deleted) {
                navigation.navigate('VaultList');
              }
            })();
          },
        },
      ],
    );
  };

  return (
    <Screen
      title={person.personName}
      subtitle={relationshipLabel(person.relationshipType)}
    >
      <View style={styles.card}>
        <DetailRow label="Relationship" value={relationshipLabel(person.relationshipType)} />
        <DetailRow
          label="Birthday"
          value={
            person.birthday
              ? formatPersonDate(person.birthday)
              : 'Not set'
          }
        />
        {daysUntilBirthday !== null ? (
          <DetailRow
            label="Next birthday"
            value={daysUntilBirthday === 0 ? 'Today' : `In ${daysUntilBirthday} days`}
          />
        ) : null}
        <DetailRow
          label="Anniversary"
          value={
            person.anniversary
              ? formatPersonDate(person.anniversary)
              : 'Not set'
          }
        />
        {daysUntilAnniversary !== null ? (
          <DetailRow
            label="Next anniversary"
            value={
              daysUntilAnniversary === 0 ? 'Today' : `In ${daysUntilAnniversary} days`
            }
          />
        ) : null}
        <DetailRow
          label="WhatsApp"
          value={person.whatsapp ?? 'Not set'}
        />
      </View>

      <View style={styles.arms}>
        <AddPersonAutoSendCard
          title="Arm birthday auto-send"
          enabled={person.autoSendBirthday}
          disabled={
            !autoSendAllowed || !person.birthday || pendingId === person.id
          }
          onToggle={() => handleArmToggle('birthday', person.autoSendBirthday)}
          body={
            autoSendAllowed
              ? undefined
              : 'Occasio Pro unlocks auto-send arming. Upgrade in Account.'
          }
        />
        <AddPersonAutoSendCard
          title="Arm anniversary auto-send"
          enabled={person.autoSendAnniversary}
          disabled={
            !autoSendAllowed || !person.anniversary || pendingId === person.id
          }
          onToggle={() => handleArmToggle('anniversary', person.autoSendAnniversary)}
          body={
            autoSendAllowed
              ? undefined
              : 'Occasio Pro unlocks auto-send arming. Upgrade in Account.'
          }
        />
      </View>

      <AutoSendPackCard
        pack={person.pack}
        lastCreationId={person.lastCreationId}
        editing={editingPack}
        message={packMessage}
        onChangeMessage={setPackMessage}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <ScreenActions>
        {editingPack ? (
          <Button
            label="Save pack"
            onPress={() => void handleSavePack()}
            loading={isSavingPack}
            disabled={isSavingPack}
          />
        ) : (
          <Button
            label="Edit auto-send pack"
            variant="secondary"
            onPress={handleEditPack}
          />
        )}
        <Button
          label="Remove from Vault"
          variant="secondary"
          onPress={handleDelete}
          loading={isDeleting}
          disabled={isDeleting}
        />
        <Button label="Back" variant="ghost" onPress={() => navigation.goBack()} />
      </ScreenActions>
    </Screen>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  muted: {
    fontSize: typography.sizeSm,
    color: colors.muted,
  },
  card: {
    marginTop: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  arms: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  row: {
    gap: spacing.xs,
  },
  rowLabel: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightSemibold,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  rowValue: {
    fontSize: typography.sizeMd,
    color: colors.ink,
  },
  error: {
    marginTop: spacing.md,
    fontSize: typography.sizeSm,
    color: colors.error,
  },
});
