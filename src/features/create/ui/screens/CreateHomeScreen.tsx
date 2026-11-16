import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useIsFocused, useScrollToTop } from '@react-navigation/native';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { CalendarDays } from '../../../../shared/ui/icons/lucide';
import { AnalyticsEvents, trackEvent } from '../../../../shared/analytics/events';
import { triggerCardHaptic } from '../../../../shared/platform/haptics';
import { useAuth } from '../../../auth/application/useAuth';
import { usePaywall } from '../../../billing/application/usePaywall';
import { useWishBalance } from '../../../billing/application/useWishBalance';
import { useHistory } from '../../../history/application/useHistory';
import { useVaultPeople } from '../../../vault/application/useVaultPeople';
import { Text } from '../../../../shared/ui/Text';
import { Screen } from '../../../../shared/ui/Screen';
import { OccasionCardSkeleton } from '../../../../shared/ui/SkeletonLayouts';
import { colors, spacing, typography } from '../../../../shared/theme/tokens';
import type { CreateStackParamList, MainTabParamList } from '../../../../shared/navigation/types';
import { useCreateDraftContext } from '../../application/CreateDraftContext';
import { useFestivalCoach } from '../../application/useFestivalCoach';
import { useBadgeCelebration } from '../../application/useBadgeCelebration';
import { BadgeCelebration } from '../components/BadgeCelebration';
import { WishBalanceCard } from '../components/WishBalanceCard';
import { CreateWishPill } from '../components/CreateWishPill';
import { HomeHeroStage } from '../components/HomeHeroStage';
import { WishJourneyCard } from '../components/WishJourneyCard';
import { AudienceCard } from '../components/AudienceCard';
import { ReminderCard } from '../components/ReminderCard';
import { UpcomingHolidays } from '../components/UpcomingHolidays';
import { UpcomingOccasionCard } from '../components/UpcomingOccasionCard';
import { VaultNudgeCard } from '../components/VaultNudgeCard';
import { getTemplateTheme } from '../../domain/templateTheme';
import { AUDIENCE_OPTIONS } from '../../domain/audienceOccasion';
import {
  audienceForRelationship,
  namesLine,
  type Opportunity,
} from '../../domain/festivalCoach';
import type { Holiday } from '../../domain/holidays';
import { freeQuotaNotice } from '../../domain/quota';
import type { Audience } from '../../domain/templateSchema';
import {
  getCreateHomeHero,
  getUpcomingOccasionsFromVault,
  getVaultNudgeContent,
} from '../../domain/createHome';
import { computeWishJourney, countArmedAutoSend } from '../../domain/wishJourney';
import { planHome, type HomeBlock, type HomeSignals } from '../../domain/homePlan';

type Props = CompositeScreenProps<
  NativeStackScreenProps<CreateStackParamList, 'CreateHome'>,
  BottomTabScreenProps<MainTabParamList>
>;

const birthdayTheme = getTemplateTheme('birthday');
/** A birthday this close counts as coming up for the plan. */
const BIRTHDAYS_SOON_DAYS = 14;

export function CreateHomeScreen({ navigation }: Props) {
  const scrollRef = useRef<ScrollView>(null);
  useScrollToTop(scrollRef);
  const isFocused = useIsFocused();

  const { isSignedIn, user } = useAuth();
  const { tier, openForced } = usePaywall();
  const { startFromAudience, startFromHoliday, startQuickCreate } = useCreateDraftContext();
  const { people, isLoading: vaultLoading } = useVaultPeople(isSignedIn);
  const { entries, isLoading: historyLoading } = useHistory(isSignedIn);

  const upcoming = useMemo(
    () => getUpcomingOccasionsFromVault(people, 2),
    [people],
  );
  const journey = useMemo(
    () =>
      computeWishJourney(isSignedIn ? entries : [], isSignedIn ? people.length : 0, new Date(), {
        armedAutoSend: isSignedIn ? countArmedAutoSend(people) : 0,
      }),
    [entries, isSignedIn, people],
  );
  const { balance, settled: balanceSettled, refresh: refreshBalance } = useWishBalance(
    isSignedIn ? (user?.uid ?? null) : null,
  );
  // Looked at again each time Home comes into view, so the festivals move on with the days.
  const [today, setToday] = useState(() => new Date());
  useEffect(() => {
    if (isFocused) setToday(new Date());
  }, [isFocused]);

  // The festival coach: which festivals to put first for this person, who to wish, and today's one nudge.
  const isPro = tier !== 'free';
  const birthdays = useMemo(
    () => upcoming.map((o) => ({ id: o.personId, name: o.personName, daysUntil: o.daysUntil })),
    [upcoming],
  );
  const coach = useFestivalCoach({
    uid: isSignedIn ? (user?.uid ?? null) : null,
    now: today,
    people: isSignedIn ? people : [],
    entries: isSignedIn ? entries : [],
    wishesReady: balance?.ready ?? null,
    enabled: isFocused,
    isPro,
    birthdays,
  });
  const festivals = useMemo(() => coach.opportunities.slice(0, 6), [coach.opportunities]);
  const festivalHints = useMemo(() => {
    const hints: Record<string, string> = {};
    for (const opportunity of festivals) {
      const line = namesLine(opportunity.suggested.map((s) => s.person.name));
      if (line) hints[opportunity.holiday.id] = `For ${line}`;
    }
    return hints;
  }, [festivals]);
  const { celebrating, dismiss: dismissCelebration } = useBadgeCelebration(
    isSignedIn ? (user?.uid ?? null) : null,
    journey.badges,
    isFocused && isSignedIn && !historyLoading && !vaultLoading,
  );
  const quotaNotice = freeQuotaNotice(isSignedIn && !historyLoading ? entries.length : 0, tier);

  const hero = useMemo(
    () => getCreateHomeHero(isSignedIn, upcoming),
    [isSignedIn, upcoming],
  );

  const vaultNudge = useMemo(
    () => getVaultNudgeContent(isSignedIn, people.length),
    [isSignedIn, people.length],
  );

  // What Home shows is decided by who is looking: a new person gets the way in and nothing else, a regular gets the
  // quick wish first, someone away for a while gets no progress to feel behind on. See `homePlan.ts`.
  const lastCard = entries.reduce<number | null>((latest, e) => {
    const made = Date.parse(e.createdAt);
    return Number.isFinite(made) && (latest === null || made > latest) ? made : latest;
  }, null);
  const signals: HomeSignals = {
    signedIn: isSignedIn,
    cardsMade: isSignedIn ? entries.length : 0,
    daysSinceLastCard:
      isSignedIn && lastCard !== null ? Math.floor((today.getTime() - lastCard) / (24 * 60 * 60 * 1000)) : null,
    peopleSaved: isSignedIn ? people.length : 0,
    birthdaysSoon: isSignedIn ? upcoming.filter((o) => o.daysUntil <= BIRTHDAYS_SOON_DAYS).length : 0,
    wishesReady: balance?.ready ?? null,
    isPro,
  };
  const plan = planHome(signals, { nudge: coach.nudge !== null, prompt: coach.planPrompt !== null });
  // The history decides the stage, so until it has loaded there is nothing honest to put in order.
  const planReady = !isSignedIn || !historyLoading;

  useEffect(() => {
    trackEvent(AnalyticsEvents.createStarted);
  }, []);

  // A card made or a purchase since the last look changes what is left.
  useEffect(() => {
    if (isFocused) void refreshBalance();
  }, [isFocused, refreshBalance]);

  const pickAudience = (audience: Audience) => {
    triggerCardHaptic();
    startFromAudience(audience);
    trackEvent(AnalyticsEvents.audienceSelected, {
      audience,
      source: 'create_home',
    });
    navigation.navigate('Occasion');
  };

  const handleQuickWish = () => {
    triggerCardHaptic();
    startQuickCreate();
    trackEvent(AnalyticsEvents.quickCreateStarted);
    navigation.navigate('AddPhotos');
  };

  /** Starts a festival card, for the first person the coach suggests when it has one. */
  const startFestival = (holiday: Holiday, opportunity: Opportunity | undefined, source: string) => {
    triggerCardHaptic();
    const first = opportunity?.suggested[0]?.person;
    startFromHoliday(
      holiday.id,
      false,
      first ? { recipientName: first.name, audience: audienceForRelationship(first.relationship) } : undefined,
    );
    trackEvent(AnalyticsEvents.holidaySelected, { holiday: holiday.id, group: holiday.group, source });
    navigation.navigate('AddPhotos');
  };

  const handleStartFestival = (holiday: Holiday) =>
    startFestival(holiday, festivals.find((o) => o.holiday.id === holiday.id), 'create_home');

  const handleNudgeStart = () => {
    if (!coach.nudge) return;
    trackEvent(AnalyticsEvents.festivalNudgeTapped, { holiday: coach.nudge.opportunity.holiday.id });
    startFestival(coach.nudge.opportunity.holiday, coach.nudge.opportunity, 'festival_nudge');
  };

  const handlePlanPromptTap = () => {
    if (!coach.planPrompt) return;
    trackEvent(AnalyticsEvents.planPromptTapped, { key: coach.planPrompt.key, kind: coach.planPrompt.kind });
    void openForced();
  };

  const handleSeeFestivals = () => {
    triggerCardHaptic();
    navigation.navigate('Holidays');
  };

  const handleSendCard = (personName: string) => {
    triggerCardHaptic();
    startQuickCreate(personName);
    trackEvent(AnalyticsEvents.quickCreateStarted, { source: 'vault' });
    navigation.navigate('AddPhotos');
  };

  const handleOpenVaultPerson = (personId: string) => {
    navigation.navigate('VaultTab', {
      screen: 'PersonDetail',
      params: { personId },
    });
  };

  const handleVaultNudge = () => {
    triggerCardHaptic();
    trackEvent(AnalyticsEvents.vaultSavePromptTapped, {
      source: 'create_home',
      signedIn: isSignedIn,
      peopleCount: people.length,
    });
    if (!isSignedIn) {
      navigation.navigate('AccountTab');
      return;
    }
    if (people.length > 0) {
      navigation.navigate('VaultTab', { screen: 'VaultList' });
      return;
    }
    navigation.navigate('VaultTab', { screen: 'AddPerson', params: {} });
  };

  const nudge = coach.nudge;
  const prompt = coach.planPrompt;
  const blocks: Record<HomeBlock, ReactNode> = {
    plan_prompt: prompt ? (
      <ReminderCard
        key="plan_prompt"
        holidayId={prompt.holidayId}
        title={prompt.title}
        body={prompt.body}
        actionLabel={prompt.actionLabel}
        laterLabel="Not now for this reminder"
        laterHint="Hides this for a week"
        onAction={handlePlanPromptTap}
        onLater={coach.dismissPlanPrompt}
      />
    ) : null,
    nudge: nudge ? (
      <ReminderCard
        key="nudge"
        holidayId={nudge.opportunity.holiday.id}
        title={nudge.title}
        body={nudge.body}
        actionLabel={nudge.actionLabel}
        laterLabel={`Not now for ${nudge.opportunity.holiday.label}`}
        laterHint="Stops reminders for this festival until next year"
        onAction={handleNudgeStart}
        onLater={coach.snoozeNudge}
      />
    ) : null,
    festivals: (
      <UpcomingHolidays
        key="festivals"
        items={festivals}
        now={today}
        hints={festivalHints}
        onPick={handleStartFestival}
        onSeeAll={handleSeeFestivals}
      />
    ),
    who: (
      <View key="who">
        <Text style={styles.gridTitle}>Who is it for?</Text>
        <View style={styles.grid}>
          {AUDIENCE_OPTIONS.map((option, index) => (
            <AudienceCard
              key={option.id}
              audience={option.id}
              label={option.label}
              cue={option.cue}
              index={index}
              onPress={() => pickAudience(option.id)}
            />
          ))}
        </View>
      </View>
    ),
    create_pill: <CreateWishPill key="create_pill" onPress={handleQuickWish} />,
    balance: balance ? (
      <WishBalanceCard
        key="balance"
        balance={balance}
        onPress={() => navigation.navigate('AccountTab')}
        onGetMore={() => void openForced()}
      />
    ) : balanceSettled && quotaNotice ? (
      <Text key="balance" style={styles.quota}>
        {quotaNotice}
      </Text>
    ) : null,
    journey: <WishJourneyCard key="journey" journey={journey} onSeeAll={() => navigation.navigate('Badges')} />,
    upcoming: vaultLoading ? (
      <UpcomingSectionSkeleton key="upcoming" />
    ) : upcoming.length > 0 ? (
      <UpcomingSection
        key="upcoming"
        vaultLoading={vaultLoading}
        peopleCount={people.length}
        upcoming={upcoming}
        onViewAll={() => navigation.navigate('VaultTab', { screen: 'VaultList' })}
        onSendCard={handleSendCard}
        onOpenVaultPerson={handleOpenVaultPerson}
      />
    ) : null,
    vault_nudge: vaultLoading ? null : (
      <VaultNudgeCard
        key="vault_nudge"
        title={vaultNudge.title}
        body={vaultNudge.body}
        actionLabel={vaultNudge.actionLabel}
        onPress={handleVaultNudge}
      />
    ),
  };

  return (
    <Screen title="Create" hideHeader scrollRef={scrollRef}>
      <HomeHeroStage
        greeting={hero.greeting}
        headline={hero.headline}
        line={hero.line}
      />

      {planReady ? (
        <View style={styles.stack}>{plan.map((block) => blocks[block]).filter(Boolean)}</View>
      ) : (
        <View style={styles.stack}>
          <OccasionCardSkeleton />
        </View>
      )}

      <BadgeCelebration
        badge={celebrating}
        firstName={journey.firstRecipient}
        next={journey.nextBadge}
        onCreate={handleQuickWish}
        onVault={() => navigation.navigate('VaultTab', { screen: 'AddPerson', params: {} })}
        onDismiss={dismissCelebration}
      />
    </Screen>
  );
}

type UpcomingSectionProps = {
  vaultLoading: boolean;
  peopleCount: number;
  upcoming: ReturnType<typeof getUpcomingOccasionsFromVault>;
  onViewAll: () => void;
  onSendCard: (personName: string) => void;
  onOpenVaultPerson: (personId: string) => void;
};

function UpcomingSectionSkeleton() {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <CalendarDays
            size={18}
            color={colors.ink}
            strokeWidth={2}
            absoluteStrokeWidth
          />
          <Text style={styles.sectionTitle}>Coming up</Text>
        </View>
      </View>
      <View style={styles.cardList}>
        <OccasionCardSkeleton />
        <OccasionCardSkeleton />
      </View>
    </View>
  );
}

function UpcomingSection({
  vaultLoading,
  peopleCount,
  upcoming,
  onViewAll,
  onSendCard,
  onOpenVaultPerson,
}: UpcomingSectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <CalendarDays
            size={18}
            color={colors.ink}
            strokeWidth={2}
            absoluteStrokeWidth
          />
          <Text style={styles.sectionTitle}>Coming up</Text>
        </View>
        {peopleCount > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="View all people in Vault"
            onPress={onViewAll}
            hitSlop={8}
          >
            <Text style={styles.sectionLink}>View all</Text>
          </Pressable>
        ) : null}
      </View>

      {vaultLoading && upcoming.length === 0 ? (
        <View style={styles.cardList}>
          <OccasionCardSkeleton />
          <OccasionCardSkeleton />
        </View>
      ) : (
        <View style={styles.cardList}>
          {upcoming.map((occasion, index) => {
            const useWarmAccent = index % 2 === 0;
            return (
              <UpcomingOccasionCard
                key={occasion.personId}
                occasion={occasion}
                accentColor={useWarmAccent ? colors.secondary : birthdayTheme.accent}
                softBackground={
                  useWarmAccent ? colors.sidebar : birthdayTheme.softBackground
                }
                onSendCard={() => onSendCard(occasion.personName)}
                onOpenVault={() => onOpenVaultPerson(occasion.personId)}
              />
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    marginTop: spacing.lg,
    gap: spacing.lg,
  },
  gridTitle: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: spacing.sm,
    marginTop: spacing.sm,
  },
  quota: {
    marginTop: -spacing.xs,
    textAlign: 'center',
    fontSize: typography.sizeXs,
    lineHeight: typography.sizeXs * 1.4,
    color: colors.muted,
    paddingHorizontal: spacing.md,
  },
  section: {
    gap: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
    minWidth: 0,
  },
  sectionTitle: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
  },
  sectionLink: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightMedium,
    color: colors.accent,
  },
  cardList: {
    gap: spacing.sm,
  },
});
