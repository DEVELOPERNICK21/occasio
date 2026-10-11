import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useScrollToTop } from '@react-navigation/native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { CloudOff, HeartPlus, UserPlus } from 'lucide-react-native';
import { triggerCardHaptic } from '../../../../shared/platform/haptics';
import { EmptyState } from '../../../../shared/ui/EmptyState';
import { Screen } from '../../../../shared/ui/Screen';
import { ScreenHeaderAction } from '../../../../shared/ui/ScreenHeaderAction';
import { Text } from '../../../../shared/ui/Text';
import {
  SessionBootSkeleton,
  VaultListSkeleton,
} from '../../../../shared/ui/SkeletonLayouts';
import { colors, radius, spacing, typography } from '../../../../shared/theme/tokens';
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
import {
  filterVaultPeople,
  getPersonNextOccasion,
  groupVaultPeople,
} from '../../domain/vaultOccasion';
import type { OccasionType, VaultPerson } from '../../domain/types';
import { ScheduledSendInboxCard } from '../components/ScheduledSendInboxCard';
import { VaultPersonCard } from '../components/VaultPersonCard';
import { VaultPersonRow } from '../components/VaultPersonRow';
import { VaultSearchField } from '../components/VaultSearchField';

type ListProps = NativeStackScreenProps<VaultStackParamList, 'VaultList'>;

function VaultListContent({ navigation, route }: ListProps) {
  const scrollRef = useRef<ScrollView>(null);
  useScrollToTop(scrollRef);

  const { people, isLoading, error, reload } = useVaultPeople(true);
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
  const sections = useMemo(() => groupVaultPeople(filtered), [filtered]);

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

  const autoSendNoteFor = (person: VaultPerson): string | undefined => {
    if (!autoSendAllowed) return 'Auto-send is part of Occasio Pro.';
    if (!person.birthday && !person.anniversary) {
      return 'Add a birthday or anniversary to turn on auto-send.';
    }
    return undefined;
  };

  const showAddAction = !isLoading && !error && people.length > 0;

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
        showAddAction ? <ScreenHeaderAction label="Add" onPress={openAddPerson} /> : undefined
      }
    >
      {showAddAction ? <VaultSearchField value={query} onChangeText={setQuery} /> : null}

      {sends.length > 0 ? (
        <View style={styles.inbox}>
          <Text style={styles.sectionTitle}>Needs review</Text>
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
        <View style={styles.linkHint}>
          <Text style={styles.linkHintText}>
            Choose someone to save this card for auto-send.
          </Text>
        </View>
      ) : null}

      {isLoading ? (
        <VaultListSkeleton />
      ) : error ? (
        <EmptyState
          icon={CloudOff}
          title="Could not load your Vault"
          body="Check your connection, then try again."
          actionLabel="Try again"
          actionVariant="secondary"
          onAction={reload}
        />
      ) : people.length === 0 ? (
        <EmptyState
          icon={UserPlus}
          title="Add the people you celebrate"
          body="Save their birthdays and anniversaries once, and see what is coming up next."
          actionLabel="Add your first person"
          onAction={openAddPerson}
        />
      ) : filtered.length === 0 ? (
        <Text style={styles.muted}>No one matches that search.</Text>
      ) : (
        sections.map((section) => (
          <View key={section.key} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.list}>
              {section.people.map((person) => {
                const theme = getVaultCardTheme(person.relationshipType);
                const occasion = getPersonNextOccasion(person);
                const autoSendBirthday = resolveArm(person, 'birthday');
                const autoSendAnniversary = resolveArm(person, 'anniversary');
                const onOpen = () => handlePersonPress(person.id, person.personName);
                const onMenu = () => openMenu(person.id, person.personName);

                if (section.key === 'later' || section.key === 'noDate') {
                  return (
                    <VaultPersonRow
                      key={person.id}
                      person={person}
                      theme={theme}
                      occasion={occasion}
                      autoSendBirthday={autoSendBirthday}
                      autoSendAnniversary={autoSendAnniversary}
                      onOpen={onOpen}
                      onMenu={onMenu}
                    />
                  );
                }

                const nextKind = occasion.kind === 'none' ? null : occasion.kind;
                const nextArmed =
                  nextKind === 'birthday' ? autoSendBirthday : autoSendAnniversary;
                const quickArm =
                  section.key === 'week' &&
                  autoSendAllowed &&
                  nextKind !== null &&
                  !nextArmed &&
                  pendingId !== person.id
                    ? {
                        label: `Turn on auto-send for ${occasionLabel(nextKind)}`,
                        onPress: () => handleAutoSendToggle(person.id, nextKind, false),
                      }
                    : undefined;

                return (
                  <VaultPersonCard
                    key={person.id}
                    person={person}
                    theme={theme}
                    occasion={occasion}
                    autoSendBirthday={autoSendBirthday}
                    autoSendAnniversary={autoSendAnniversary}
                    autoSendNote={autoSendNoteFor(person)}
                    quickArm={quickArm}
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
                    onOpen={onOpen}
                    onMenu={onMenu}
                  />
                );
              })}
            </View>
          </View>
        ))
      )}

      {showAddAction ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add another person"
          onPress={openAddPerson}
          style={({ pressed }) => [styles.addRow, pressed && styles.addRowPressed]}
        >
          <UserPlus size={18} color={colors.accentHover} strokeWidth={2} absoluteStrokeWidth />
          <Text style={styles.addRowLabel}>Add another person</Text>
        </Pressable>
      ) : null}

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
        icon={HeartPlus}
        headline="Never miss a moment for the people you love."
        benefits={[
          'Save birthdays and anniversaries in one place',
          'See who is coming up next at a glance',
          'Auto-send cards you have reviewed first',
        ]}
        onSignIn={() => requireAuth('vault_view', () => undefined)}
      />
    );
  }

  return <VaultListContent {...props} />;
}

const styles = StyleSheet.create({
  section: {
    marginTop: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightSemibold,
    color: colors.inkSoft,
  },
  list: {
    marginTop: spacing.sm,
    gap: spacing.md,
  },
  inbox: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  muted: {
    marginTop: spacing.lg,
    fontSize: typography.sizeSm,
    color: colors.muted,
    textAlign: 'center',
  },
  linkHint: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.sidebar,
    borderWidth: 1,
    borderColor: colors.border,
  },
  linkHintText: {
    fontSize: typography.sizeSm,
    color: colors.inkSoft,
    lineHeight: typography.sizeSm * 1.4,
  },
  addRow: {
    marginTop: spacing.md,
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.accentSoft,
  },
  addRowPressed: {
    backgroundColor: colors.sidebar,
  },
  addRowLabel: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightSemibold,
    color: colors.accentHover,
  },
  error: {
    marginTop: spacing.md,
    fontSize: typography.sizeSm,
    color: colors.error,
    textAlign: 'center',
  },
});
