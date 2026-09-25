import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useMemo, useState } from 'react';
import { Alert, Share, StyleSheet, View } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { Text } from '../../../../shared/ui/Text';
import { Button } from '../../../../shared/ui/Button';
import { Screen } from '../../../../shared/ui/Screen';
import { ScreenActions } from '../../../../shared/ui/ScreenActions';
import { PersonDetailSkeleton } from '../../../../shared/ui/SkeletonLayouts';
import { colors, radius, spacing, typography } from '../../../../shared/theme/tokens';
import type {
  HistoryStackParamList,
  LinkCreationParam,
  MainTabParamList,
} from '../../../../shared/navigation/types';
import { useRequireAuth, useAuth } from '../../../auth/application/useAuth';
import { useCreateDraftContext } from '../../../create/application/CreateDraftContext';
import { useLinkCreationToPerson } from '../../../vault/application/useLinkCreationToPerson';
import { useVaultPeople } from '../../../vault/application/useVaultPeople';
import { useHistory, useDeleteHistory } from '../../application/useHistory';
import { templateLabel } from '../../domain/display';
import {
  formatHistoryDate,
  isHistoryEntryExpired,
} from '../../domain/historyRules';

type Props = CompositeScreenProps<
  NativeStackScreenProps<HistoryStackParamList, 'HistoryDetail'>,
  BottomTabScreenProps<MainTabParamList>
>;

export function HistoryDetailScreen({ navigation, route }: Props) {
  const { entries, isLoading } = useHistory(true);
  const { remove, isDeleting } = useDeleteHistory();
  const { loadForEdit } = useCreateDraftContext();
  const [isLoadingEdit, setIsLoadingEdit] = useState(false);
  const { isSignedIn } = useAuth();
  const { requireAuth } = useRequireAuth();
  const { people } = useVaultPeople(isSignedIn);
  const { link, isSaving: isLinking, error: linkError } = useLinkCreationToPerson();
  const entry = useMemo(
    () => entries.find((item) => item.id === route.params.entryId),
    [entries, route.params.entryId],
  );

  if (isLoading) {
    return (
      <Screen title="Card" scroll={false}>
        <PersonDetailSkeleton />
      </Screen>
    );
  }

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

  const busy = isDeleting || isLoadingEdit;

  const handleEdit = () => {
    if (expired || !entry.creationId) {
      Alert.alert('Link expired', 'Create a new card to send a fresh link.');
      return;
    }

    requireAuth('history_sync', () => {
      void (async () => {
        setIsLoadingEdit(true);
        const err = await loadForEdit(entry.creationId);
        setIsLoadingEdit(false);
        if (err) {
          Alert.alert('Could not edit', err);
          return;
        }
        navigation.navigate('CreateTab', { screen: 'AddPhotos' });
      })();
    });
  };

  const handleDelete = () => {
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
                return;
              }
              navigation.goBack();
            });
          },
        },
      ],
    );
  };

  const linkCreation: LinkCreationParam = {
    creationId: entry.creationId,
    templateType: entry.templateType,
    templateId: null,
    photoRefs: [],
    message: entry.message.trim(),
    fromName: null,
  };

  const goPickPersonInVault = () => {
    navigation.navigate('VaultTab', {
      screen: 'VaultList',
      params: { linkCreation },
    });
  };

  const handleSaveForAutoSend = () => {
    requireAuth('autosend_enable', () => {
      if (people.length === 0 || people.length > 2) {
        goPickPersonInVault();
        return;
      }

      Alert.alert(
        'Save for auto-send',
        'Choose who this card is for.',
        [
          ...people.map((person) => ({
            text: person.personName,
            onPress: () => {
              void link(person.id, linkCreation).then((ok) => {
                if (ok) {
                  Alert.alert(
                    'Saved for auto-send',
                    `We'll use this card for ${person.personName}.`,
                  );
                }
              });
            },
          })),
          { text: 'Cancel', style: 'cancel' as const },
        ],
      );
    });
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
          disabled={expired || busy}
        />
        <Button
          label="Copy link"
          variant="secondary"
          onPress={handleCopy}
          disabled={expired || busy}
        />
        {entry.creationId && !expired ? (
          <Button
            label="Edit card"
            variant="secondary"
            loading={isLoadingEdit}
            disabled={busy}
            onPress={handleEdit}
          />
        ) : null}
        {entry.creationId ? (
          <Button
            label="Save for auto-send"
            variant="secondary"
            loading={isLinking}
            disabled={busy}
            onPress={handleSaveForAutoSend}
          />
        ) : null}
        {linkError ? <Text style={styles.expired}>{linkError}</Text> : null}
        <Button
          label="Delete from History"
          variant="ghost"
          loading={isDeleting}
          onPress={handleDelete}
          disabled={busy}
          style={styles.deleteBtn}
        />
        <Button
          label="Back"
          variant="ghost"
          onPress={() => navigation.goBack()}
          disabled={busy}
        />
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
  deleteBtn: {
    marginTop: spacing.sm,
  },
});
