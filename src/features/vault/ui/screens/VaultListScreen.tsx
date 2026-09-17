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
import { useSubscription } from '../../../billing/application/useSubscription';
import { useAuth, useRequireAuth } from '../../../auth/application/useAuth';
import { GuestGateScreen } from '../../../../shared/ui/GuestGateScreen';
import { useDeletePerson } from '../../application/useDeletePerson';
import { useLinkCreationToPerson } from '../../application/useLinkCreationToPerson';
import { useScheduledSends } from '../../application/useScheduledSends';
import { useToggleAutoSend } from '../../application/useToggleAutoSend';
import { useVaultPeople } from '../../application/useVaultPeople';
import {
  formatReviewDeadline,
  occasionLabel,
} from '../../domain/scheduledSend';
import { getVaultCardTheme } from '../../domain/vaultCardTheme';
import { filterVaultPeople, getPersonNextOccasion } from '../../domain/vaultOccasion';
import type { OccasionType, VaultPerson } from '../../domain/types';
import { ScheduledSendInboxCard } from '../components/ScheduledSendInboxCard';
import { VaultExpandPrompt } from '../components/VaultExpandPrompt';
import { VaultPersonCard } from '../components/VaultPersonCard';
import { VaultSearchField } from '../components/VaultSearchField';

type ListProps = NativeStackScreenProps<VaultStackParamList, 'VaultList'>;

function VaultListContent({ navigation, route }: ListProps) {
  const scrollRef = useRef<ScrollView>(null);
  useScrollToTop(scrollRef);

  const { people, isLoading, error } = useVaultPeople(true);
  const { sends, reviewCount, error: sendsError } = useScheduledSends(true);
  const { tier } = useSubscription();
  const { remove } = useDeletePerson();
  const { toggle, error: toggleError, autoSendAllowed, pendingId } =
    useToggleAutoSend(tier);
  const { link, isSaving: isLinking, error: linkError } = useLinkCreationToPerson();
  const linkCreation = route.params?.linkCreation;
  const [query, setQuery] = useState('');
  const [optimisticArms, setOptimisticArms] = useState<
    Record<string, Partial<Record<OccasionType, boolean>>>
  >({});

  const filtered = useMemo(
    () => filterVaultPeople(people, query),
    [people, query],
  );

  useEffect(() => {
    setOptimisticArms((current) => {
      if (Object.keys(current).length === 0) {
        return current;
      }

      const next = { ...current };
      let changed = false;

      for (const person of people) {
        const pending = next[person.id];
        if (!pending) continue;

        const resolved = { ...pending };
        if (
          pending.birthday !== undefined &&
          pending.birthday === person.autoSendBirthday
        ) {
          delete resolved.birthday;
        }
        if (
          pending.anniversary !== undefined &&
          pending.anniversary === person.autoSendAnniversary
        ) {
          delete resolved.anniversary;
        }

        if (resolved.birthday === undefined && resolved.anniversary === undefined) {
          delete next[person.id];
          changed = true;
        } else if (
          resolved.birthday !== pending.birthday ||
          resolved.anniversary !== pending.anniversary
        ) {
          next[person.id] = resolved;
          changed = true;
        }
      }

      return changed ? next : current;
    });
  }, [people]);

  const resolveArm = (person: VaultPerson, occasion: OccasionType) => {
    const pending = optimisticArms[person.id]?.[occasion];
    if (pending !== undefined) return pending;
    return occasion === 'birthday'
      ? person.autoSendBirthday
      : person.autoSendAnniversary;
  };

  const openAddPerson = () => {
    triggerCardHaptic();
    navigation.navigate('AddPerson', { linkCreation });
  };

  const openPerson = (personId: string) => {
    navigation.navigate('PersonDetail', { personId });
  };

  const openReview = (sendId: string) => {
    triggerCardHaptic();
    navigation.navigate('ScheduledSendReview', { sendId });
  };

  const handlePersonPress = (personId: string, personName: string) => {
    if (!linkCreation) {
      openPerson(personId);
      return;
    }
    if (isLinking) return;

    void link(personId, linkCreation).then((ok) => {
      if (!ok) return;
      Alert.alert(
        'Saved for auto-send',
        `We'll use this card for ${personName}.`,
      );
      navigation.setParams({ linkCreation: undefined });
    });
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

  const handleAutoSendToggle = (
    personId: string,
    occasion: OccasionType,
    current: boolean,
  ) => {
    triggerCardHaptic();
    const next = !current;
    setOptimisticArms((prev) => ({
      ...prev,
      [personId]: { ...prev[personId], [occasion]: next },
    }));
    void toggle(personId, occasion, next).then((ok) => {
      if (!ok) {
        setOptimisticArms((prev) => {
          const copy = { ...prev };
          const pending = { ...copy[personId] };
          delete pending[occasion];
          if (pending.birthday === undefined && pending.anniversary === undefined) {
            delete copy[personId];
          } else {
            copy[personId] = pending;
          }
          return copy;
        });
      }
    });
  };

  const subtitle =
    reviewCount > 0
      ? reviewCount === 1
        ? '1 card waiting for review.'
        : `${reviewCount} cards waiting for review.`
      : 'People you celebrate — birthdays and reminders.';

  return (
    <Screen
      title="Vault"
      subtitle={subtitle}
      scrollRef={scrollRef}
      headerAction={
        <ScreenHeaderAction label="Add" onPress={openAddPerson} />
      }
    >
      <VaultSearchField value={query} onChangeText={setQuery} />

      {sends.length > 0 ? (
        <View style={styles.inbox}>
          {sends.map((send) => {
            const person = people.find((item) => item.id === send.relationshipId);
            const personName =
              send.personName?.trim() || person?.personName.trim() || 'This person';
            return (
              <ScheduledSendInboxCard
                key={send.id}
                personName={personName}
                occasionLabel={occasionLabel(send.occasionType)}
                deadlineLabel={formatReviewDeadline(send.reviewDeadline)}
                status={send.status}
                onPress={() => openReview(send.id)}
              />
            );
          })}
        </View>
      ) : null}

      {linkCreation ? (
        <Text style={styles.linkHint}>
          Choose someone to save this card for auto-send.
        </Text>
      ) : null}

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
            const autoSendBirthday = resolveArm(person, 'birthday');
            const autoSendAnniversary = resolveArm(person, 'anniversary');

            return (
              <VaultPersonCard
                key={person.id}
                person={person}
                theme={theme}
                occasion={occasion}
                autoSendBirthday={autoSendBirthday}
                autoSendAnniversary={autoSendAnniversary}
                birthdayDisabled={
                  !autoSendAllowed ||
                  !person.birthday ||
                  pendingId === person.id
                }
                anniversaryDisabled={
                  !autoSendAllowed ||
                  !person.anniversary ||
                  pendingId === person.id
                }
                onBirthdayToggle={() =>
                  handleAutoSendToggle(person.id, 'birthday', autoSendBirthday)
                }
                onAnniversaryToggle={() =>
                  handleAutoSendToggle(person.id, 'anniversary', autoSendAnniversary)
                }
                onOpenVault={() => handlePersonPress(person.id, person.personName)}
                onNote={() => handlePersonPress(person.id, person.personName)}
                onMenu={() => openMenu(person.id, person.personName)}
              />
            );
          })}
        </View>
      )}

      {people.length > 0 ? <VaultExpandPrompt onPress={openAddPerson} /> : null}

      {toggleError ? <Text style={styles.error}>{toggleError}</Text> : null}
      {linkError ? <Text style={styles.error}>{linkError}</Text> : null}
      {sendsError ? <Text style={styles.error}>{sendsError}</Text> : null}
    </Screen>
  );
}

export function VaultListScreen(props: ListProps) {
  const { isSignedIn, isLoading } = useAuth();
  const { requireAuth } = useRequireAuth();

  if (isLoading) {
    return <SessionBootSkeleton withTabBar />;
  }

  if (!isSignedIn) {
    return (
      <GuestGateScreen
        title="Vault"
        message="Save people and birthdays so you never miss a moment."
        isSignedIn={false}
        onSignIn={() => requireAuth('vault_view', () => undefined)}
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
  inbox: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  muted: {
    marginTop: spacing.md,
    fontSize: typography.sizeSm,
    color: colors.muted,
    textAlign: 'center',
  },
  linkHint: {
    marginTop: spacing.md,
    fontSize: typography.sizeSm,
    color: colors.inkSoft,
    lineHeight: typography.sizeSm * 1.4,
  },
  error: {
    marginTop: spacing.md,
    fontSize: typography.sizeSm,
    color: colors.error,
    textAlign: 'center',
  },
});
