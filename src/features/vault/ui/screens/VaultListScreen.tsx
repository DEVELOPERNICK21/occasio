import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../../../shared/ui/Text';
import { Screen } from '../../../../shared/ui/Screen';
import { ScreenHeaderAction } from '../../../../shared/ui/ScreenHeaderAction';
import { colors, radius, shadow, spacing, typography } from '../../../../shared/theme/tokens';
import { useAuth } from '../../../auth/application/useAuth';
import { GuestGateScreen } from '../../../auth/ui/screens/GuestGateScreen';
import { useVaultPeople } from '../../application/useVaultPeople';
import {
  daysUntilPersonDate,
  formatPersonDate,
} from '../../domain/personRules';
import { relationshipLabel } from '../../domain/relationshipTypes';
import type { VaultStackParamList } from '../../../../shared/navigation/types';

type ListProps = NativeStackScreenProps<VaultStackParamList, 'VaultList'>;

function VaultListContent({ navigation }: ListProps) {
  const { people, isLoading, error } = useVaultPeople(true);
  const upcoming = people
    .filter((person) => person.birthday)
    .map((person) => ({
      person,
      days: daysUntilPersonDate(person.birthday!),
    }))
    .sort((a, b) => a.days - b.days)
    .slice(0, 3);

  return (
    <Screen
      title="Vault"
      subtitle="People you never want to forget"
      headerAction={
        <ScreenHeaderAction
          label="Add"
          onPress={() => navigation.navigate('AddPerson', {})}
        />
      }
    >
      {isLoading ? (
        <Text style={styles.muted}>Loading…</Text>
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : people.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No people yet</Text>
          <Text style={styles.emptyBody}>
            Save someone you care about — their birthday, WhatsApp, and auto-send
            preferences live here.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {people.map((person) => (
            <View key={person.id} style={styles.row}>
              <View style={styles.rowMain}>
                <Text style={styles.rowName}>{person.personName}</Text>
                <Text style={styles.rowMeta}>
                  {relationshipLabel(person.relationshipType)}
                  {person.birthday ? ` · ${formatPersonDate(person.birthday)}` : ''}
                </Text>
              </View>
            </View>
          ))}

          {upcoming.length > 0 ? (
            <View style={styles.upcoming}>
              <Text style={styles.upcomingTitle}>Upcoming</Text>
              {upcoming.map(({ person, days }) => (
                <Text key={person.id} style={styles.upcomingRow}>
                  · {person.personName} birthday
                  {days === 0 ? ' today' : ` in ${days}d`}
                </Text>
              ))}
            </View>
          ) : null}
        </View>
      )}
    </Screen>
  );
}

export function VaultListScreen(props: ListProps) {
  const { isSignedIn, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Screen title="Vault">
        <Text style={styles.muted}>Checking session…</Text>
      </Screen>
    );
  }

  if (!isSignedIn) {
    return (
      <GuestGateScreen
        title="Vault"
        message="Save people, birthdays, and auto-send preferences in one place."
        action="vault_view"
      />
    );
  }

  return <VaultListContent {...props} />;
}

const styles = StyleSheet.create({
  muted: {
    fontSize: typography.sizeSm,
    color: colors.muted,
  },
  error: {
    fontSize: typography.sizeSm,
    color: colors.error,
  },
  empty: {
    marginTop: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  emptyTitle: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
  },
  emptyBody: {
    fontSize: typography.sizeSm,
    lineHeight: typography.sizeSm * 1.45,
    color: colors.inkSoft,
  },
  list: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  rowMain: {
    flex: 1,
    gap: spacing.xs,
  },
  rowName: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
  },
  rowMeta: {
    fontSize: typography.sizeSm,
    color: colors.muted,
  },
  upcoming: {
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.sidebar,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  upcomingTitle: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightSemibold,
    color: colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  upcomingRow: {
    fontSize: typography.sizeSm,
    color: colors.inkSoft,
  },
});
