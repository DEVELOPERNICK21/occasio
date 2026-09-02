import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useScrollToTop } from '@react-navigation/native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { triggerCardHaptic } from '../../../../shared/platform/haptics';
import { Screen } from '../../../../shared/ui/Screen';
import { ScreenHeaderAction } from '../../../../shared/ui/ScreenHeaderAction';
import { Text } from '../../../../shared/ui/Text';
import {
  SessionBootSkeleton,
  VaultListSkeleton,
} from '../../../../shared/ui/SkeletonLayouts';
import { colors, spacing, typography } from '../../../../shared/theme/tokens';
import type { VaultStackParamList } from '../../../../shared/navigation/types';
import { useAuth } from '../../../auth/application/useAuth';
import { GuestGateScreen } from '../../../auth/ui/screens/GuestGateScreen';
import { useDeletePerson } from '../../application/useDeletePerson';
import { useToggleAutoSend } from '../../application/useToggleAutoSend';
import { useVaultPeople } from '../../application/useVaultPeople';
import { getVaultCardTheme } from '../../domain/vaultCardTheme';
import { filterVaultPeople, getPersonNextOccasion } from '../../domain/vaultOccasion';
import type { VaultPerson } from '../../domain/types';
import { VaultExpandPrompt } from '../components/VaultExpandPrompt';
import { VaultPersonCard } from '../components/VaultPersonCard';
import { VaultSearchField } from '../components/VaultSearchField';

type ListProps = NativeStackScreenProps<VaultStackParamList, 'VaultList'>;

function VaultListContent({ navigation }: ListProps) {
  const scrollRef = useRef<ScrollView>(null);
  useScrollToTop(scrollRef);

  const { people, isLoading, error } = useVaultPeople(true);
  const { remove } = useDeletePerson();
  const { toggle, error: toggleError, autoSendAllowed } = useToggleAutoSend();
  const [query, setQuery] = useState('');
  const [optimisticAutoSend, setOptimisticAutoSend] = useState<
    Record<string, boolean>
  >({});

  const filtered = useMemo(
    () => filterVaultPeople(people, query),
    [people, query],
  );

  useEffect(() => {
    setOptimisticAutoSend((current) => {
      if (Object.keys(current).length === 0) {
        return current;
      }

      const next = { ...current };
      let changed = false;

      for (const person of people) {
        if (
          person.id in next &&
          next[person.id] === person.autoSendBirthday
        ) {
          delete next[person.id];
          changed = true;
        }
      }

      return changed ? next : current;
    });
  }, [people]);

  const resolveAutoSend = (person: VaultPerson) =>
    person.id in optimisticAutoSend
      ? optimisticAutoSend[person.id]
      : person.autoSendBirthday;

  const openAddPerson = () => {
    triggerCardHaptic();
    navigation.navigate('AddPerson', {});
  };

  const openPerson = (personId: string) => {
    navigation.navigate('PersonDetail', { personId });
  };

  const openMenu = (personId: string, personName: string) => {
    Alert.alert(personName, undefined, [
      {
        text: 'View details',
        onPress: () => openPerson(personId),
      },
      {
        text: 'Remove from Vault',
        style: 'destructive',
        onPress: () => {
          Alert.alert(
            'Remove from Vault?',
            `${personName} will be removed. Auto-send for this person will stop.`,
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Remove',
                style: 'destructive',
                onPress: () => {
                  void remove(personId);
                },
              },
            ],
          );
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleAutoSendToggle = (personId: string, current: boolean) => {
    triggerCardHaptic();
    const next = !current;
    setOptimisticAutoSend((prev) => ({ ...prev, [personId]: next }));
    void toggle(personId, next).then((ok) => {
      if (!ok) {
        setOptimisticAutoSend((prev) => {
          const copy = { ...prev };
          delete copy[personId];
          return copy;
        });
      }
    });
  };

  return (
    <Screen
      title="Vault"
      subtitle="People you celebrate — birthdays and auto-send."
      scrollRef={scrollRef}
      headerAction={
        <ScreenHeaderAction label="Add" onPress={openAddPerson} />
      }
    >
      <VaultSearchField value={query} onChangeText={setQuery} />

      {isLoading ? (
        <VaultListSkeleton />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : people.length === 0 ? (
        <VaultExpandPrompt onPress={openAddPerson} />
      ) : filtered.length === 0 ? (
        <Text style={styles.muted}>No one matches that search.</Text>
      ) : (
        <View style={styles.list}>
          {filtered.map((person) => {
            const theme = getVaultCardTheme(person.relationshipType);
            const occasion = getPersonNextOccasion(person);
            const autoSendEnabled = resolveAutoSend(person);

            return (
              <VaultPersonCard
                key={person.id}
                person={person}
                theme={theme}
                occasion={occasion}
                autoSendEnabled={autoSendEnabled}
                autoSendDisabled={!autoSendAllowed || !person.birthday}
                onAutoSendToggle={() =>
                  handleAutoSendToggle(person.id, autoSendEnabled)
                }
                onOpenVault={() => openPerson(person.id)}
                onNote={() => openPerson(person.id)}
                onMenu={() => openMenu(person.id, person.personName)}
              />
            );
          })}
        </View>
      )}

      {people.length > 0 ? <VaultExpandPrompt onPress={openAddPerson} /> : null}

      {toggleError ? <Text style={styles.error}>{toggleError}</Text> : null}
    </Screen>
  );
}

export function VaultListScreen(props: ListProps) {
  const { isSignedIn, isLoading } = useAuth();

  if (isLoading) {
    return <SessionBootSkeleton withTabBar />;
  }

  if (!isSignedIn) {
    return (
      <GuestGateScreen
        title="Vault"
        message="Save people and birthdays so you never miss a moment."
        action="vault_view"
      />
    );
  }

  return <VaultListContent {...props} />;
}

const styles = StyleSheet.create({
  list: {
    marginTop: spacing.md,
    gap: spacing.md,
  },
  muted: {
    marginTop: spacing.md,
    fontSize: typography.sizeSm,
    color: colors.muted,
    textAlign: 'center',
  },
  error: {
    marginTop: spacing.md,
    fontSize: typography.sizeSm,
    color: colors.error,
    textAlign: 'center',
  },
});
