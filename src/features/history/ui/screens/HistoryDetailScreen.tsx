import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, Share, StyleSheet, View } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { triggerSuccessHaptic } from '../../../../shared/platform/haptics';
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
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { isSignedIn } = useAuth();
  const { requireAuth } = useRequireAuth();
  const { people } = useVaultPeople(isSignedIn);
  const { link, isSaving: isLinking, error: linkError } = useLinkCreationToPerson();
  const entry = useMemo(
    () => entries.find((item) => item.id === route.params.entryId),
    [entries, route.params.entryId],
  );

  useEffect(
    () => () => {
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
    },
    [],
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
      <Screen title="Card" onBack={() => navigation.goBack()}>
        <Text style={styles.muted}>This card could not be found. It may have been deleted.</Text>
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
      triggerSuccessHaptic();
      setCopied(true);
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
      copiedTimer.current = setTimeout(() => setCopied(false), 1800);
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

  const goCreate = () => {
    navigation.navigate('CreateTab', { screen: 'CreateHome' });
  };

  return (
    <Screen
      title={entry.recipientName}
      subtitle={`${templateLabel(entry.templateType)} · ${formatHistoryDate(entry.createdAt)}`}
      onBack={() => navigation.goBack()}
    >
      {expired ? (
        <View style={styles.notice}>
          <Text style={styles.noticeText}>
            This link has expired. Make a new card to send it again.
          </Text>
        </View>
      ) : null}

      {entry.message ? (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Message</Text>
          <Text style={styles.message}>{entry.message}</Text>
        </View>
      ) : null}

      <View style={styles.card}>
        <View style={styles.statusRow}>
          <View style={[styles.dot, expired ? styles.dotExpired : styles.dotActive]} />
          <Text style={styles.cardLabel}>
            {expired ? 'Expired' : `Active until ${formatHistoryDate(entry.expiresAt)}`}
          </Text>
        </View>
        <Text style={styles.link} selectable>
          {entry.shareUrl}
        </Text>
      </View>

      <ScreenActions>
        {expired ? (
          <Button label="Make a new card" onPress={goCreate} disabled={busy} />
        ) : (
          <>
            <Button label="Share again" onPress={() => void handleShare()} disabled={busy} />
            <View style={styles.pair}>
              <Button
                label={copied ? 'Copied' : 'Copy link'}
                variant="secondary"
                onPress={handleCopy}
                disabled={busy}
                style={styles.pairItem}
                accessibilityLiveRegion="polite"
              />
              {entry.creationId ? (
                <Button
                  label="Edit card"
                  variant="secondary"
                  loading={isLoadingEdit}
                  disabled={busy}
                  onPress={handleEdit}
                  style={styles.pairItem}
                />
              ) : null}
            </View>
          </>
        )}
        {entry.creationId ? (
          <Button
            label="Save for auto-send"
            variant="secondary"
            loading={isLinking}
            disabled={busy}
            onPress={handleSaveForAutoSend}
          />
        ) : null}
        {linkError ? <Text style={styles.errorText}>{linkError}</Text> : null}
        <Pressable
          accessibilityRole="button"
          disabled={busy}
          onPress={handleDelete}
          style={({ pressed }) => [styles.delete, (pressed || busy) && styles.deletePressed]}
        >
          <Text style={styles.deleteLabel}>
            {isDeleting ? 'Deleting…' : 'Delete from History'}
          </Text>
        </Pressable>
      </ScreenActions>
    </Screen>
  );
}

const styles = StyleSheet.create({
  muted: {
    fontSize: typography.sizeSm,
    color: colors.muted,
  },
  notice: {
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.amberSoft,
  },
  noticeText: {
    fontSize: typography.sizeSm,
    lineHeight: typography.sizeSm * 1.45,
    color: colors.ink,
  },
  card: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  cardLabel: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightSemibold,
    color: colors.inkSoft,
  },
  message: {
    fontSize: typography.sizeMd,
    lineHeight: typography.sizeMd * 1.45,
    color: colors.ink,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
  },
  dotActive: {
    backgroundColor: colors.sage,
  },
  dotExpired: {
    backgroundColor: colors.muted,
  },
  link: {
    fontSize: typography.sizeSm,
    color: colors.accentHover,
    lineHeight: typography.sizeSm * 1.5,
  },
  pair: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  pairItem: {
    flex: 1,
  },
  errorText: {
    fontSize: typography.sizeSm,
    color: colors.error,
  },
  delete: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  deletePressed: {
    opacity: 0.6,
  },
  deleteLabel: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightSemibold,
    color: colors.error,
  },
});
