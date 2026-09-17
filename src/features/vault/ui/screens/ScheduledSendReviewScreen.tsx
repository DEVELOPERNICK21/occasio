import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo } from 'react';
import { Linking, Pressable, Share, StyleSheet, View } from 'react-native';
import { Text } from '../../../../shared/ui/Text';
import { Button } from '../../../../shared/ui/Button';
import { Screen } from '../../../../shared/ui/Screen';
import { ScreenActions } from '../../../../shared/ui/ScreenActions';
import { PersonDetailSkeleton } from '../../../../shared/ui/SkeletonLayouts';
import { colors, radius, spacing, typography } from '../../../../shared/theme/tokens';
import type { VaultStackParamList } from '../../../../shared/navigation/types';
import { useReviewSend } from '../../application/useReviewSend';
import { useScheduledSends } from '../../application/useScheduledSends';
import { useVaultPeople } from '../../application/useVaultPeople';
import {
  REVIEW_NO_PHOTOS_COPY,
  canApproveScheduledSend,
  formatPhotoCountLabel,
  formatReviewDeadline,
  occasionLabel,
  resolveReviewPhotoCount,
} from '../../domain/scheduledSend';

type Props = NativeStackScreenProps<VaultStackParamList, 'ScheduledSendReview'>;

export function ScheduledSendReviewScreen({ navigation, route }: Props) {
  const { sends, isLoading, error: loadError } = useScheduledSends(true);
  const { people } = useVaultPeople(true);
  const { approve, cancel, pendingId, error: actionError } = useReviewSend();

  const send = useMemo(
    () => sends.find((item) => item.id === route.params.sendId),
    [sends, route.params.sendId],
  );

  const person = useMemo(
    () => (send ? people.find((item) => item.id === send.relationshipId) : undefined),
    [people, send],
  );

  if (isLoading) {
    return (
      <Screen title="Review send" scroll={false} onBack={() => navigation.goBack()}>
        <PersonDetailSkeleton />
      </Screen>
    );
  }

  if (!send) {
    return (
      <Screen title="Review send" onBack={() => navigation.goBack()}>
        <Text style={styles.muted}>
          {loadError ?? 'This send is no longer waiting for review.'}
        </Text>
        <ScreenActions align="start">
          <Button label="Back" variant="ghost" onPress={() => navigation.goBack()} />
        </ScreenActions>
      </Screen>
    );
  }

  const personName = send.personName?.trim() || person?.personName.trim() || 'This person';
  const occasion = occasionLabel(send.occasionType);
  const deadlineLabel = formatReviewDeadline(send.reviewDeadline);
  const photoCount = resolveReviewPhotoCount({
    packPhotoCount: person?.pack?.photoRefs.length,
    lastCreationId: person?.lastCreationId,
    shareUrl: send.shareUrl,
    generatedCreationId: send.generatedCreationId,
  });
  const canApprove = send.status === 'review' && canApproveScheduledSend(photoCount);
  const isPending = pendingId === send.id;
  const message = person?.pack?.defaultMessage.trim() || 'No message saved yet.';
  const error = actionError ?? loadError;

  const goBackToList = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    navigation.navigate('VaultList');
  };

  const openShareSheet = async (shareUrl: string) => {
    try {
      await Share.share({ message: shareUrl, url: shareUrl });
    } catch {
      // User dismissed share sheet
    }
  };

  const handleApprove = async () => {
    const result = await approve(send.id);
    if (!result) return;
    const shareUrl = result.shareUrl ?? send.shareUrl;
    if (shareUrl) {
      await openShareSheet(shareUrl);
    }
    goBackToList();
  };

  const handleCancel = async () => {
    const ok = await cancel(send.id);
    if (ok) {
      goBackToList();
    }
  };

  const handleShareApproved = async () => {
    if (!send.shareUrl) return;
    await openShareSheet(send.shareUrl);
  };

  const handleOpenCard = () => {
    if (!send.shareUrl) return;
    void Linking.openURL(send.shareUrl);
  };

  return (
    <Screen
      title={personName}
      subtitle={`${occasion} · ${deadlineLabel}`}
      onBack={goBackToList}
    >
      <View style={styles.card}>
        <DetailRow label="Occasion" value={occasion} />
        <DetailRow label="Review window" value={deadlineLabel} />
        <DetailRow label="Photos" value={formatPhotoCountLabel(photoCount)} />
        <DetailRow label="Message" value={message} />
        {send.shareUrl ? (
          <Pressable
            accessibilityRole="link"
            accessibilityLabel="Open card link"
            onPress={handleOpenCard}
            style={styles.linkHit}
          >
            <Text style={styles.link}>Open card link</Text>
          </Pressable>
        ) : (
          <Text style={styles.hint}>Card link appears after generation.</Text>
        )}
      </View>

      {photoCount === 0 ? (
        <Text style={styles.warning}>{REVIEW_NO_PHOTOS_COPY}</Text>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <ScreenActions>
        {send.status === 'review' ? (
          <>
            <Button
              label="Approve & send"
              onPress={() => void handleApprove()}
              loading={isPending}
              disabled={!canApprove || isPending}
            />
            <Button
              label="Cancel send"
              variant="secondary"
              onPress={() => void handleCancel()}
              disabled={isPending}
            />
          </>
        ) : (
          <Button
            label="Send the link"
            onPress={() => void handleShareApproved()}
            disabled={!send.shareUrl}
          />
        )}
      </ScreenActions>
    </Screen>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  muted: {
    fontSize: typography.sizeSm,
    color: colors.muted,
  },
  card: {
    marginTop: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  row: {
    gap: spacing.xs,
  },
  rowLabel: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightSemibold,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  rowValue: {
    fontSize: typography.sizeMd,
    color: colors.ink,
    lineHeight: typography.sizeMd * 1.4,
  },
  hint: {
    fontSize: typography.sizeSm,
    color: colors.inkSoft,
  },
  linkHit: {
    minHeight: 48,
    justifyContent: 'center',
  },
  link: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightSemibold,
    color: colors.accent,
  },
  warning: {
    marginTop: spacing.md,
    fontSize: typography.sizeSm,
    color: colors.inkSoft,
    lineHeight: typography.sizeSm * 1.4,
  },
  error: {
    marginTop: spacing.md,
    fontSize: typography.sizeSm,
    color: colors.error,
  },
});
