import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { Text } from '../../../../shared/ui/Text';
import { Button } from '../../../../shared/ui/Button';
import { Screen } from '../../../../shared/ui/Screen';
import { ScreenActions } from '../../../../shared/ui/ScreenActions';
import { PersonDetailSkeleton } from '../../../../shared/ui/SkeletonLayouts';
import { colors, radius, spacing, typography } from '../../../../shared/theme/tokens';
import type { VaultStackParamList } from '../../../../shared/navigation/types';
import { useDeletePerson } from '../../application/useDeletePerson';
import { useVaultPeople } from '../../application/useVaultPeople';
import {
  daysUntilPersonDate,
  formatPersonDate,
} from '../../domain/personRules';
import { relationshipLabel } from '../../domain/relationshipTypes';

type Props = NativeStackScreenProps<VaultStackParamList, 'PersonDetail'>;

export function PersonDetailScreen({ navigation, route }: Props) {
  const { people, isLoading } = useVaultPeople(true);
  const { remove, isDeleting, error } = useDeletePerson();

  const person = useMemo(
    () => people.find((item) => item.id === route.params.personId),
    [people, route.params.personId],
  );

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
          label="WhatsApp"
          value={person.whatsapp ?? 'Not set'}
        />
        <DetailRow
          label="Auto-send"
          value={person.autoSendBirthday ? 'On for birthday' : 'Off'}
        />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <ScreenActions>
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
