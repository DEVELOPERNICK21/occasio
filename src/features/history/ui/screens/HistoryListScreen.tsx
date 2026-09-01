import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../../../../shared/ui/Text';
import { Screen } from '../../../../shared/ui/Screen';
import { ScreenHeaderAction } from '../../../../shared/ui/ScreenHeaderAction';
import { colors, radius, shadow, spacing, typography } from '../../../../shared/theme/tokens';
import type { HistoryStackParamList } from '../../../../shared/navigation/types';
import { useAuth } from '../../../auth/application/useAuth';
import { GuestGateScreen } from '../../../auth/ui/screens/GuestGateScreen';
import { useHistory } from '../../application/useHistory';
import { templateLabel } from '../../domain/display';
import {
  formatHistoryDate,
  isHistoryEntryExpired,
} from '../../domain/historyRules';

type ListProps = NativeStackScreenProps<HistoryStackParamList, 'HistoryList'>;

function HistoryListContent({ navigation }: ListProps) {
  const { entries, isLoading, error } = useHistory(true);

  return (
    <Screen
      title="History"
      subtitle="Cards you have shared"
      headerAction={
        <ScreenHeaderAction
          label="Create"
          onPress={() => navigation.getParent()?.navigate('CreateTab')}
        />
      }
    >
      {isLoading ? (
        <Text style={styles.muted}>Loading…</Text>
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : entries.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No creations yet</Text>
          <Text style={styles.emptyBody}>
            Cards you share while signed in will appear here so you can resend them
            later.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {entries.map((entry) => {
            const expired = isHistoryEntryExpired(entry);
            return (
              <Pressable
                key={entry.id}
                accessibilityRole="button"
                onPress={() => navigation.navigate('HistoryDetail', { entryId: entry.id })}
                style={styles.row}
              >
                <View style={styles.rowMain}>
                  <Text style={styles.rowTitle}>
                    {entry.recipientName} · {templateLabel(entry.templateType)}
                  </Text>
                  <Text style={styles.rowMeta}>
                    Shared {formatHistoryDate(entry.createdAt)}
                    {expired ? ' · Expired' : ''}
                  </Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

export function HistoryListScreen(props: ListProps) {
  const { isSignedIn, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Screen title="History">
        <Text style={styles.muted}>Checking session…</Text>
      </Screen>
    );
  }

  if (!isSignedIn) {
    return (
      <GuestGateScreen
        title="History"
        message="Past creations and reshares, synced across your devices."
        action="history_sync"
      />
    );
  }

  return <HistoryListContent {...props} />;
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
  rowTitle: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
  },
  rowMeta: {
    fontSize: typography.sizeSm,
    color: colors.muted,
  },
  chevron: {
    fontSize: typography.sizeXl,
    color: colors.muted,
    marginLeft: spacing.sm,
  },
});
