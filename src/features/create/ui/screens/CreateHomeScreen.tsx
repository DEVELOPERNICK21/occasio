import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useScrollToTop } from '@react-navigation/native';
import { useEffect, useMemo, useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { CalendarDays } from 'lucide-react-native';
import { AnalyticsEvents, trackEvent } from '../../../../shared/analytics/events';
import { triggerCardHaptic } from '../../../../shared/platform/haptics';
import { useAuth } from '../../../auth/application/useAuth';
import { usePaywall } from '../../../billing/application/usePaywall';
import { useHistory } from '../../../history/application/useHistory';
import { useVaultPeople } from '../../../vault/application/useVaultPeople';
import { Text } from '../../../../shared/ui/Text';
import { Screen } from '../../../../shared/ui/Screen';
import { OccasionCardSkeleton } from '../../../../shared/ui/SkeletonLayouts';
import { colors, spacing, typography } from '../../../../shared/theme/tokens';
import type { CreateStackParamList, MainTabParamList } from '../../../../shared/navigation/types';
import { useCreateDraftContext } from '../../application/CreateDraftContext';
import { MilestoneCard } from '../components/MilestoneCard';
import { CreateWishPill } from '../components/CreateWishPill';
import { CreateHomeHero } from '../components/CreateHomeHero';
import { AmbientWishField } from '../components/AmbientWishField';
import { AudienceCard } from '../components/AudienceCard';
import { UpcomingOccasionCard } from '../components/UpcomingOccasionCard';
import { VaultNudgeCard } from '../components/VaultNudgeCard';
import { getTemplateTheme } from '../../domain/templateTheme';
import { AUDIENCE_OPTIONS } from '../../domain/audienceOccasion';
import { freeQuotaNotice } from '../../domain/quota';
import type { Audience } from '../../domain/templateSchema';
import {
  countWishesThisMonth,
  getCreateHomeHero,
  getMilestoneCardContent,
  getUpcomingOccasionsFromVault,
  getVaultNudgeContent,
  shouldShowVaultNudge,
} from '../../domain/createHome';

type Props = CompositeScreenProps<
  NativeStackScreenProps<CreateStackParamList, 'CreateHome'>,
  BottomTabScreenProps<MainTabParamList>
>;

const birthdayTheme = getTemplateTheme('birthday');

export function CreateHomeScreen({ navigation }: Props) {
  const scrollRef = useRef<ScrollView>(null);
  useScrollToTop(scrollRef);

  const { isSignedIn } = useAuth();
  const { tier } = usePaywall();
  const { startFromAudience, startQuickCreate } = useCreateDraftContext();
  const { people, isLoading: vaultLoading } = useVaultPeople(isSignedIn);
  const { entries, isLoading: historyLoading } = useHistory(isSignedIn);

  const upcoming = useMemo(
    () => getUpcomingOccasionsFromVault(people, 2),
    [people],
  );
  const wishCount = useMemo(
    () => (isSignedIn && !historyLoading ? countWishesThisMonth(entries) : 0),
    [entries, historyLoading, isSignedIn],
  );
  const milestone = useMemo(
    () => getMilestoneCardContent(wishCount, isSignedIn, people.length),
    [isSignedIn, people.length, wishCount],
  );
  const quotaNotice = freeQuotaNotice(wishCount, tier);

  const hero = useMemo(
    () => getCreateHomeHero(isSignedIn, upcoming),
    [isSignedIn, upcoming],
  );

  const showVaultNudge = useMemo(
    () => shouldShowVaultNudge(upcoming.length, isSignedIn && vaultLoading),
    [isSignedIn, upcoming.length, vaultLoading],
  );

  const vaultNudge = useMemo(
    () => getVaultNudgeContent(isSignedIn, people.length),
    [isSignedIn, people.length],
  );

  const showMilestone = !historyLoading || !isSignedIn;

  useEffect(() => {
    trackEvent(AnalyticsEvents.createStarted);
  }, []);

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

  return (
    <Screen
      title="Create"
      hideHeader
      scrollRef={scrollRef}
      ambient={<AmbientWishField />}
    >
      <CreateHomeHero
        greeting={hero.greeting}
        headline={hero.headline}
        line={hero.line}
      />

      <View style={styles.grid}>
        {AUDIENCE_OPTIONS.map((option) => (
          <AudienceCard
            key={option.id}
            audience={option.id}
            label={option.label}
            cue={option.cue}
            onPress={() => pickAudience(option.id)}
          />
        ))}
      </View>

      <View style={styles.engagementSection}>
        <CreateWishPill onPress={handleQuickWish} />
        {quotaNotice ? <Text style={styles.quota}>{quotaNotice}</Text> : null}

        {isSignedIn && !showVaultNudge ? (
          <UpcomingSection
            vaultLoading={vaultLoading}
            peopleCount={people.length}
            upcoming={upcoming}
            onViewAll={() => navigation.navigate('VaultTab', { screen: 'VaultList' })}
            onSendCard={handleSendCard}
            onOpenVaultPerson={handleOpenVaultPerson}
          />
        ) : isSignedIn && vaultLoading ? (
          <UpcomingSectionSkeleton />
        ) : null}

        {showVaultNudge ? (
          <VaultNudgeCard
            title={vaultNudge.title}
            body={vaultNudge.body}
            actionLabel={vaultNudge.actionLabel}
            onPress={handleVaultNudge}
          />
        ) : null}

        {showMilestone ? (
          <MilestoneCard
            eyebrow={milestone.eyebrow}
            headline={milestone.headline}
            headlineHighlight={milestone.headlineHighlight}
            body={milestone.body}
          />
        ) : null}
      </View>
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: spacing.sm,
    marginTop: spacing.md,
  },
  quota: {
    marginTop: -spacing.xs,
    textAlign: 'center',
    fontSize: typography.sizeXs,
    lineHeight: typography.sizeXs * 1.4,
    color: colors.muted,
    paddingHorizontal: spacing.md,
  },
  engagementSection: {
    marginTop: spacing.lg,
    gap: spacing.md,
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
