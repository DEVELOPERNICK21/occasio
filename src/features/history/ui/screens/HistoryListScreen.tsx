import type { NavigationProp } from '@react-navigation/native';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useScrollToTop } from '@react-navigation/native';
import Clipboard from '@react-native-clipboard/clipboard';
import { useMemo, useRef, useState } from 'react';
import { Alert, ScrollView, Share, StyleSheet, View } from 'react-native';
import { triggerCardHaptic } from '../../../../shared/platform/haptics';
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
import { useAuth } from '../../../auth/application/useAuth';
import { GuestGateScreen } from '../../../auth/ui/screens/GuestGateScreen';
import { useHistory } from '../../application/useHistory';
import {
  filterHistoryEntries,
  historyStatusHeadline,
  summarizeHistory,
} from '../../domain/historyList';
import { isHistoryEntryExpired } from '../../domain/historyRules';
import type { HistoryEntry } from '../../domain/types';
import { HistoryExpandPrompt } from '../components/HistoryExpandPrompt';
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

  const { entries, isLoading, error } = useHistory(true);
  const [query, setQuery] = useState('');

  const filtered = useMemo(
    () => filterHistoryEntries(entries, query),
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
        message: `A wish for ${entry.recipientName}: ${entry.shareUrl}`,
        url: entry.shareUrl,
      });
    } catch {
      // User dismissed share sheet
    }
  };

  const copyEntry = (entry: HistoryEntry) => {
    if (isHistoryEntryExpired(entry)) {
      Alert.alert('Link expired', 'Create a new card to send a fresh link.');
      return;
    }
    try {
      Clipboard.setString(entry.shareUrl);
    } catch {
      Alert.alert('Could not copy', 'Try again from the card detail screen.');
    }
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
        onPress: () => copyEntry(entry),
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
      <SearchPill
        value={query}
        onChangeText={setQuery}
        placeholder="Search by name or occasion..."
      />

      {isLoading ? (
        <HistoryListSkeleton />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : entries.length === 0 ? (
        <HistoryExpandPrompt onPress={goCreate} />
      ) : (
        <>
          <HistorySummaryCard summary={summary} />

          {filtered.length === 0 ? (
            <Text style={styles.muted}>No wishes match that search.</Text>
          ) : (
            <View style={styles.list}>
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
                    onCopy={() => {
                      triggerCardHaptic();
                      copyEntry(entry);
                    }}
                    onMenu={() => openMenu(entry)}
                  />
                );
              })}
            </View>
          )}

          <HistoryExpandPrompt onPress={goCreate} />
        </>
      )}
    </Screen>
  );
}

export function HistoryListScreen(props: ListProps) {
  const { isSignedIn, isLoading } = useAuth();

  if (isLoading) {
    return <SessionBootSkeleton withTabBar />;
  }

  if (!isSignedIn) {
    return (
      <GuestGateScreen
        title="History"
        message="Past cards and share links, synced when you sign in."
        action="history_sync"
      />
    );
  }

  return <HistoryListContent {...props} />;
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
