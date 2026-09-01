import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo } from 'react';
import { Alert, Share, StyleSheet, View } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { Text } from '../../../../shared/ui/Text';
import { Button } from '../../../../shared/ui/Button';
import { Screen } from '../../../../shared/ui/Screen';
import { ScreenActions } from '../../../../shared/ui/ScreenActions';
import { colors, radius, spacing, typography } from '../../../../shared/theme/tokens';
import type { HistoryStackParamList } from '../../../../shared/navigation/types';
import { useHistory } from '../../application/useHistory';
import { templateLabel } from '../../domain/display';
import {
  formatHistoryDate,
  isHistoryEntryExpired,
} from '../../domain/historyRules';

type Props = NativeStackScreenProps<HistoryStackParamList, 'HistoryDetail'>;

export function HistoryDetailScreen({ navigation, route }: Props) {
  const { entries } = useHistory(true);
  const entry = useMemo(
    () => entries.find((item) => item.id === route.params.entryId),
    [entries, route.params.entryId],
  );

  if (!entry) {
    return (
      <Screen title="Card">
        <Text style={styles.muted}>This entry could not be found.</Text>
        <ScreenActions align="start">
          <Button label="Back" variant="ghost" onPress={() => navigation.goBack()} />
        </ScreenActions>
      </Screen>
    );
  }

  const expired = isHistoryEntryExpired(entry);

  const handleShare = async () => {
    if (expired) {
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

  const handleCopy = () => {
    try {
      Clipboard.setString(entry.shareUrl);
    } catch {
      Alert.alert('Could not copy', 'Long-press the link to copy manually.');
    }
  };

  return (
    <Screen
      title={entry.recipientName}
      subtitle={`${templateLabel(entry.templateType)} · ${formatHistoryDate(entry.createdAt)}`}
    >
      {expired ? (
        <Text style={styles.expired}>This link has expired. Create a new card to send again.</Text>
      ) : null}

      {entry.message ? (
        <View style={styles.messageBox}>
          <Text style={styles.messageLabel}>Message</Text>
          <Text style={styles.message}>{entry.message}</Text>
        </View>
      ) : null}

      <View style={styles.linkBox}>
        <Text style={styles.linkLabel}>Share link</Text>
        <Text style={styles.link} selectable>
          {entry.shareUrl}
        </Text>
        <Text style={styles.expiry}>
          {expired ? 'Expired' : `Active until ${formatHistoryDate(entry.expiresAt)}`}
        </Text>
      </View>

      <ScreenActions>
        <Button
          label="Share again"
          onPress={() => void handleShare()}
          disabled={expired}
        />
        <Button label="Copy link" variant="secondary" onPress={handleCopy} disabled={expired} />
        <Button label="Back" variant="ghost" onPress={() => navigation.goBack()} />
      </ScreenActions>
    </Screen>
  );
}

const styles = StyleSheet.create({
  muted: {
    fontSize: typography.sizeSm,
    color: colors.muted,
  },
  expired: {
    fontSize: typography.sizeSm,
    color: colors.error,
    marginBottom: spacing.md,
  },
  messageBox: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  messageLabel: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightSemibold,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  message: {
    fontSize: typography.sizeMd,
    lineHeight: typography.sizeMd * 1.45,
    color: colors.inkSoft,
  },
  linkBox: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  linkLabel: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightSemibold,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  link: {
    fontSize: typography.sizeSm,
    color: colors.accent,
    lineHeight: typography.sizeSm * 1.5,
  },
  expiry: {
    fontSize: typography.sizeXs,
    color: colors.muted,
  },
});
