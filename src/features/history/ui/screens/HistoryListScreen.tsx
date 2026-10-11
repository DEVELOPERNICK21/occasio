import type { NavigationProp } from '@react-navigation/native';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useScrollToTop } from '@react-navigation/native';
import Clipboard from '@react-native-clipboard/clipboard';
import { useMemo, useRef, useState } from 'react';
import { Alert, ScrollView, Share, StyleSheet, View } from 'react-native';
import { CloudOff, History, Send } from 'lucide-react-native';
import { triggerCardHaptic, triggerSuccessHaptic } from '../../../../shared/platform/haptics';
import { EmptyState } from '../../../../shared/ui/EmptyState';
import { Screen } from '../../../../shared/ui/Screen';
import { SearchPill } from '../../../../shared/ui/SearchPill';
import { Text } from '../../../../shared/ui/Text';
import {
  HistoryListSkeleton,
  SessionBootSkeleton,
} from '../../../../shared/ui/SkeletonLayouts';
import { colors, spacing, typography } from '../../../../shared/theme/tokens';
import type { HistoryStackParamList, MainTabParamList } from '../../../../shared/navigation/types';
import { getTemplateTheme } from '../../../create/domain/templateTheme';
import type { TemplateType } from '../../../create/domain/types';
import { useAuth, useRequireAuth } from '../../../auth/application/useAuth';
import { GuestGateScreen } from '../../../../shared/ui/GuestGateScreen';
import { useHistory, useDeleteHistory } from '../../application/useHistory';
import { shareMessage } from '../../../create/domain/shareLink';
import {
  filterHistoryEntries,
  historyStatusHeadline,
  sortHistoryEntries,
  summarizeHistory,
} from '../../domain/historyList';
import { isHistoryEntryExpired } from '../../domain/historyRules';
import type { HistoryEntry } from '../../domain/types';
import { HistorySummaryCard } from '../components/HistorySummaryCard';
import { HistoryWishCard } from '../components/HistoryWishCard';

type ListProps = CompositeScreenProps<
  NativeStackScreenProps<HistoryStackParamList, 'HistoryList'>,
  BottomTabScreenProps<MainTabParamList>
>;

function themeForEntry(templateType: string) {
  return getTemplateTheme(templateType as TemplateType);
}

function HistoryListContent({ navigation }: ListProps) {
  const scrollRef = useRef<ScrollView>(null);
  useScrollToTop(scrollRef);

  const { entries, isLoading, error, reload } = useHistory(true);
  const { remove, isDeleting } = useDeleteHistory();
  const [query, setQuery] = useState('');

  const filtered = useMemo(
    () => sortHistoryEntries(filterHistoryEntries(entries, query)),
    [entries, query],
  );
  const summary = useMemo(() => summarizeHistory(entries), [entries]);

  const openDetail = (entryId: string) => {
    navigation.navigate('HistoryDetail', { entryId });
  };

  const shareEntry = async (entry: HistoryEntry) => {
    if (isHistoryEntryExpired(entry)) {
      Alert.alert('Link expired', 'Create a new card to send a fresh link.');
      return;
    }
    try {
      await Share.share({
        message: `${shareMessage(entry.recipientName, '')} ${entry.shareUrl}`,
        url: entry.shareUrl,
      });
    } catch {
      // User dismissed share sheet
    }
  };

  /** Returns true when the link reached the clipboard. */
  const copyEntry = (entry: HistoryEntry): boolean => {
    if (isHistoryEntryExpired(entry)) {
      Alert.alert('Link expired', 'Create a new card to send a fresh link.');
      return false;
    }
    try {
      Clipboard.setString(entry.shareUrl);
      triggerSuccessHaptic();
      return true;
    } catch {
      Alert.alert('Could not copy', 'Try again from the card detail screen.');
      return false;
    }
  };

  const confirmDelete = (entry: HistoryEntry) => {
    Alert.alert(
      'Delete this card?',
      `“${entry.recipientName}” will be removed from History and the share link will stop working. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void remove(entry.id).then((err) => {
              if (err) {
                Alert.alert('Could not delete', err);
              }
            });
          },
        },
      ],
    );
  };

  const openMenu = (entry: HistoryEntry) => {
    Alert.alert(entry.recipientName, undefined, [
      {
        text: 'View details',
        onPress: () => openDetail(entry.id),
      },
      {
        text: 'Share again',
        onPress: () => {
          void shareEntry(entry);
        },
      },
      {
        text: 'Copy link',
        onPress: () => {
          copyEntry(entry);
        },
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => confirmDelete(entry),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const goCreate = () => {
    triggerCardHaptic();
    navigation
      .getParent<NavigationProp<MainTabParamList>>()
      ?.navigate('CreateTab', { screen: 'CreateHome' });
  };

  return (
    <Screen
      title="History"
      subtitle="Cards you shared — resend links anytime."
      scrollRef={scrollRef}
    >
      {isLoading ? (
        <HistoryListSkeleton />
      ) : error ? (
        <EmptyState
          icon={CloudOff}
          title="Could not load your History"
          body="Check your connection, then try again."
          actionLabel="Try again"
          actionVariant="secondary"
          onAction={reload}
        />
      ) : entries.length === 0 ? (
        <EmptyState
          icon={Send}
          title="No cards shared yet"
          body="Cards you share while signed in show up here, so you can send the link again anytime."
          actionLabel="Create a card"
          onAction={goCreate}
        />
      ) : (
        <View style={styles.stack}>
          <SearchPill
            value={query}
            onChangeText={setQuery}
            placeholder="Search by name or occasion"
          />
          <HistorySummaryCard summary={summary} />

          {filtered.length === 0 ? (
            <Text style={styles.muted}>No wishes match that search.</Text>
          ) : (
            <View style={[styles.list, isDeleting ? styles.listBusy : null]}>
              {filtered.map((entry) => {
                const expired = isHistoryEntryExpired(entry);
                const theme = themeForEntry(entry.templateType);

                return (
                  <HistoryWishCard
                    key={entry.id}
                    entry={entry}
                    theme={theme}
                    statusHeadline={historyStatusHeadline(entry)}
                    expired={expired}
                    onPress={() => openDetail(entry.id)}
                    onShare={() => {
                      triggerCardHaptic();
                      void shareEntry(entry);
                    }}
                    onCopy={() => copyEntry(entry)}
                    onCreateNew={goCreate}
                    onMenu={() => openMenu(entry)}
                  />
                );
              })}
            </View>
          )}
        </View>
      )}
    </Screen>
  );
}

export function HistoryListScreen(props: ListProps) {
  const { isSignedIn, isLoading } = useAuth();
  const { requireAuth } = useRequireAuth();

  if (isLoading) {
    return <SessionBootSkeleton withTabBar />;
  }

  if (!isSignedIn) {
    return (
      <GuestGateScreen
        title="History"
        icon={History}
        headline="Every card you share, saved."
        benefits={[
          'Send a link again or copy it in one tap',
          'See which links are still active',
          'Pick up on any device when you sign in',
        ]}
        onSignIn={() => requireAuth('history_sync', () => undefined)}
      />
    );
  }

  return <HistoryListContent {...props} />;
}

const styles = StyleSheet.create({
  stack: {
    gap: spacing.md,
  },
  list: {
    gap: spacing.md,
  },
  listBusy: {
    opacity: 0.7,
  },
  muted: {
    marginTop: spacing.lg,
    fontSize: typography.sizeSm,
    color: colors.muted,
    textAlign: 'center',
  },
});
