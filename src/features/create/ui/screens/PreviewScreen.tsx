import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useMemo } from 'react';
import { ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { AnalyticsEvents, trackEvent } from '../../../../shared/analytics/events';
import { Text } from '../../../../shared/ui/Text';
import { useAuth } from '../../../auth/application/useAuth';
import { usePaywall } from '../../../billing/application/usePaywall';
import { useHistory } from '../../../history/application/useHistory';
import { useCreateDraftContext } from '../../application/CreateDraftContext';
import { useCreateShareLink } from '../../application/useCreateShareLink';
import {
  isInteractiveExperience,
  resolveDraftExperienceMode,
  storyBeatHint,
} from '../../domain/experienceMode';
import { freeQuotaNotice, PRO_YEARLY_CARD_LIMIT } from '../../domain/quota';
import { PACKAGE_SINGLE_WISH } from '../../../billing/domain/entitlements';
import { CardPreviewStage } from '../components/CardPreviewStage';
import type { CreateStackParamList } from '../../../../shared/navigation/types';
import { Button } from '../../../../shared/ui/Button';
import { Screen } from '../../../../shared/ui/Screen';
import { ScreenActions } from '../../../../shared/ui/ScreenActions';
import { colors, spacing, typography } from '../../../../shared/theme/tokens';
import { CreateNudge, CreateProgress } from '../components/CreateProgress';

type Props = NativeStackScreenProps<CreateStackParamList, 'Preview'>;

export function PreviewScreen({ navigation }: Props) {
  const { draft, isEditing, clearEditing } = useCreateDraftContext();
  const { isSignedIn, requestAuth } = useAuth();
  const { entries } = useHistory(isSignedIn);
  const {
    open: openPaywall,
    isConfigured,
    tier,
    plans,
    purchase,
    error: billingError,
    resolveExtraWish,
  } = usePaywall();
  const cardsCreated = isSignedIn ? entries.length : 0;
  const { generate, isLoading, error, paywallRequired, reset } =
    useCreateShareLink({
      cardsCreated,
      tier,
      resolveExtraWish,
    });
  const quotaNotice = isEditing
    ? null
    : freeQuotaNotice(cardsCreated, tier);

  useEffect(() => {
    trackEvent(AnalyticsEvents.previewOpened, {
      templateType: draft.templateType ?? undefined,
    });
  }, [draft.templateType]);

  useEffect(() => {
    if (!paywallRequired || isEditing) {
      return;
    }

    if (!isConfigured) {
      Alert.alert(
        'Plans unavailable',
        'We could not load the Occasio Pro plans right now. Check your connection and try again.',
      );
      reset();
      return;
    }

    const openShare = () => {
      void generate(draft).then((created) => {
        if (!created) return;
        trackEvent(AnalyticsEvents.cardShared, { shareSlug: created.shareSlug });
        navigation.navigate('ShareSuccess', {
          shareUrl: created.shareUrl,
          expiresAt: created.expiresAt,
          creationId: created.creationId,
          shareSlug: created.shareSlug,
          wasUpdated: false,
        });
      });
    };

    // A Pro member out of yearly cards already owns Pro; selling it again is a dead end.
    if (tier !== 'free') {
      const wish = plans.find((p) => p.id.toLowerCase().includes(PACKAGE_SINGLE_WISH));
      if (!wish) {
        Alert.alert(
          'No cards left this year',
          `Your plan includes ${PRO_YEARLY_CARD_LIMIT} cards a year, and they are used. One more wish is not available right now — try again soon.`,
          [{ text: 'OK', onPress: reset }],
          { cancelable: true, onDismiss: reset },
        );
        return;
      }
      Alert.alert(
        'No cards left this year',
        `Your plan includes ${PRO_YEARLY_CARD_LIMIT} cards a year, and they are used. Buy one more wish for ${wish.priceLabel}?`,
        [
          { text: 'Not now', style: 'cancel', onPress: reset },
          {
            text: 'Buy one wish',
            onPress: () => {
              reset();
              void purchase(wish.id).then((bought) => {
                if (bought) openShare();
              });
            },
          },
        ],
        { cancelable: true, onDismiss: reset },
      );
      return;
    }

    void openPaywall().then((result) => {
      reset();
      if (result === 'purchased' || result === 'restored') {
        openShare();
      }
    });
  }, [
    paywallRequired,
    isEditing,
    isConfigured,
    openPaywall,
    tier,
    plans,
    purchase,
    reset,
    generate,
    draft,
    navigation,
  ]);

  const goShareSuccess = (
    created: {
      shareUrl: string;
      expiresAt: string;
      creationId: string;
      shareSlug: string;
    },
    updated: boolean,
  ) => {
    trackEvent(AnalyticsEvents.cardShared, { shareSlug: created.shareSlug });
    navigation.navigate('ShareSuccess', {
      shareUrl: created.shareUrl,
      expiresAt: created.expiresAt,
      creationId: created.creationId,
      shareSlug: created.shareSlug,
      wasUpdated: updated,
    });
  };

  const handleGenerate = () => {
    // Free wishes are counted per account on the server; a guest has nothing to count against.
    if (!isSignedIn && !isEditing) {
      requestAuth('create_link', () => void createLink());
      return;
    }
    void createLink();
  };

  const createLink = async () => {
    if (paywallRequired && !isEditing) {
      if (!isConfigured) {
        Alert.alert(
          'Plans unavailable',
          'We could not load the Occasio Pro plans right now. Check your connection and try again.',
        );
        return;
      }
      await openPaywall();
      return;
    }

    const result = await generate(draft);
    if (result) {
      const updated = Boolean(draft.editingCreationId);
      if (updated) {
        clearEditing();
      }
      goShareSuccess(result, updated);
    } else if (error) {
      trackEvent(AnalyticsEvents.uploadFailed, { message: error });
    }
  };

  const primaryLabel = isLoading
    ? isEditing
      ? 'Saving…'
      : 'Creating link…'
    : isEditing
      ? 'Save changes'
      : 'Create the link';

  return (
    <Screen
      title="Preview"
      subtitle={
        isEditing
          ? 'Updates keep the same share link'
          : 'This is what they’ll open'
      }
      progress={<CreateProgress stage="preview" />}
      onBack={() => navigation.goBack()}
    >
      <CreateNudge stage="preview" />
      <CardPreviewStage
        recipientName={draft.recipientName}
        message={draft.message}
        occasion={draft.occasion}
        templateType={draft.templateType}
        templateId={draft.templateId}
        photoUris={draft.photoUris}
        fromName={draft.fromName}
      />
      {isLoading ? (
        <ActivityIndicator style={styles.loader} color={colors.accent} />
      ) : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {billingError && !isEditing ? (
        <Text style={styles.error}>{billingError}</Text>
      ) : null}

      <ScreenActions>
        <Button
          label={primaryLabel}
          disabled={isLoading}
          onPress={handleGenerate}
        />
      </ScreenActions>

      {isInteractiveExperience(draft.templateType) &&
      resolveDraftExperienceMode(draft.templateType, draft.experienceMode) ===
        'story' ? (
        <Text style={styles.hint}>{storyBeatHint(draft.templateType)}</Text>
      ) : null}
      <Text style={styles.hint}>
        {isEditing
          ? 'Anyone with the link will see your updates. The URL stays the same.'
          : 'Your link will be private and unlisted — only people you share it with can open it.'}
      </Text>
      {quotaNotice ? <Text style={styles.hint}>{quotaNotice}</Text> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loader: {
    marginTop: spacing.lg,
  },
  error: {
    marginTop: spacing.md,
    color: colors.error,
    fontSize: typography.sizeSm,
    lineHeight: typography.sizeSm * 1.4,
  },
  hint: {
    marginTop: spacing.md,
    fontSize: typography.sizeXs,
    color: colors.muted,
    lineHeight: typography.sizeXs * 1.5,
    textAlign: 'center',
  },
});
