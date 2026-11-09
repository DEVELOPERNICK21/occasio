import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { AnalyticsEvents, trackEvent } from '../../../../shared/analytics/events';
import { appPlatform } from '../../../../shared/platform/runtime';
import { NoticeCard } from '../../../../shared/ui/NoticeCard';
import { Text } from '../../../../shared/ui/Text';
import { useAuth } from '../../../auth/application/useAuth';
import { useBillingNotice } from '../../../billing/application/useBillingNotice';
import { useWishBalance } from '../../../billing/application/useWishBalance';
import { usePaywall } from '../../../billing/application/usePaywall';
import { describeBillingNotice } from '../../../billing/domain/billingNotice';
import { nextWishNotice } from '../../../billing/domain/wishBalance';
import { useFreeCardsUsed } from '../../../billing/application/useFreeCardsUsed';
import { useCreateDraftContext } from '../../application/CreateDraftContext';
import { useCreateShareLink } from '../../application/useCreateShareLink';
import { useTemplateCatalog } from '../../application/useTemplateCatalog';
import { framePhotosMessage, framePhotosShort } from '../../domain/creationRules';
import {
  isInteractiveExperience,
  resolveDraftExperienceMode,
  storyBeatHint,
} from '../../domain/experienceMode';
import { INVITATION_TEMPLATE } from '../../domain/invitation';
import { freeQuotaNotice, PRO_YEARLY_CARD_LIMIT } from '../../domain/quota';
import { PACKAGE_SINGLE_WISH } from '../../../billing/domain/entitlements';
import { CardPreviewStage } from '../components/CardPreviewStage';
import { InvitationSummary } from '../components/InvitationSummary';
import { InviteProgress } from '../components/InviteProgress';
import { CreateProblemSheet } from '../components/CreateProblemSheet';
import { FreeCardSheet } from '../components/FreeCardSheet';
import type { CreateStackParamList } from '../../../../shared/navigation/types';
import { Button } from '../../../../shared/ui/Button';
import { PipLoader } from '../../../../shared/ui/PipLoader';
import { Screen } from '../../../../shared/ui/Screen';
import { ScreenActions } from '../../../../shared/ui/ScreenActions';
import { colors, spacing, typography } from '../../../../shared/theme/tokens';
import { CreateNudge, CreateProgress } from '../components/CreateProgress';

type Props = NativeStackScreenProps<CreateStackParamList, 'Preview'>;

/** Plans could not be loaded at all (billing is not set up, or the offer list is empty). */
function alertPlansUnavailable() {
  const notice = describeBillingNotice('NOT_CONFIGURED', { platform: appPlatform() });
  Alert.alert(notice.title, notice.message);
}

export function PreviewScreen({ navigation }: Props) {
  const { draft, isEditing, clearEditing } = useCreateDraftContext();
  const { isSignedIn, requestAuth, user, canSignInWithApple, signInGoogle, signInApple } =
    useAuth();
  const { getById } = useTemplateCatalog();
  const {
    open: openPaywall,
    isConfigured,
    tier,
    plans,
    purchase,
    resolveExtraWish,
  } = usePaywall();
  const billingNotice = useBillingNotice();
  // The server's count of free cards, not local History rows, which can lag or fail to sync.
  const { used: freeCardsUsed, refresh: resolveFreeCardsUsed } = useFreeCardsUsed(
    isSignedIn ? (user?.uid ?? null) : null,
  );
  const cardsCreated = freeCardsUsed ?? 0;
  const frame = draft.templateId ? getById(draft.templateId) : null;
  const photoSlots = frame?.photoSlots ?? null;
  const photosShort = framePhotosShort(draft.photoUris.length, photoSlots);
  const { generate, isLoading, error, paywallRequired, freeCardBlocked, reset } =
    useCreateShareLink({
      cardsCreated,
      tier,
      resolveExtraWish,
      resolveFreeCardsUsed,
      photoSlots,
    });
  const invitation = draft.templateType === INVITATION_TEMPLATE ? draft.invitation : null;
  const { balance } = useWishBalance(isSignedIn ? (user?.uid ?? null) : null);
  // Say which of their wishes this card will use, from the server's own count; fall back to the plain
  // free-card line for a guest or when the count could not be read.
  const quotaNotice = isEditing
    ? null
    : (balance ? nextWishNotice(balance) : null) ??
      freeQuotaNotice(cardsCreated, tier, user ? user.viaGoogleOrApple === true : true);

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
      alertPlansUnavailable();
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

  const showPlans = async () => {
    if (!isConfigured) {
      alertPlansUnavailable();
      return;
    }
    await openPaywall();
  };

  const createLink = async () => {
    if (paywallRequired && !isEditing) {
      await showPlans();
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
          : invitation
            ? 'This is what your guests will open'
            : 'This is what they’ll open'
      }
      progress={invitation ? <InviteProgress stage="review" /> : <CreateProgress stage="preview" />}
      onBack={() => navigation.goBack()}
    >
      {invitation ? null : <CreateNudge stage="preview" />}
      {invitation ? (
        <InvitationSummary invitation={invitation} photoUri={draft.photoUris[0] ?? null} note={draft.message} />
      ) : (
        <CardPreviewStage
          recipientName={draft.recipientName}
          message={draft.message}
          occasion={draft.occasion}
          templateType={draft.templateType}
          templateId={draft.templateId}
          photoUris={draft.photoUris}
          fromName={draft.fromName}
        />
      )}
      {isLoading ? (
        <View style={styles.loader}>
          <PipLoader kind={isEditing ? 'saving' : 'creating'} holdsGift={!isEditing} size={84} />
        </View>
      ) : null}
      {photosShort > 0 && photoSlots !== null ? (
        <Text style={styles.error}>{framePhotosMessage(photosShort, photoSlots)}</Text>
      ) : null}
      {billingNotice && !isEditing ? (
        <View style={styles.notice}>
          <NoticeCard {...billingNotice} />
        </View>
      ) : null}

      <ScreenActions>
        <Button
          label={primaryLabel}
          disabled={isLoading || photosShort > 0}
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
          : invitation
            ? 'Your link is unlisted. Send it to your guests; anyone who has it can open the invitation.'
            : 'Your link will be private and unlisted — only people you share it with can open it.'}
      </Text>
      {quotaNotice ? <Text style={styles.hint}>{quotaNotice}</Text> : null}
      <CreateProblemSheet message={error} onRetry={() => void createLink()} onClose={reset} />
      <FreeCardSheet
        reason={freeCardBlocked}
        canSignInWithApple={canSignInWithApple}
        signInGoogle={signInGoogle}
        signInApple={signInApple}
        onSeePlans={() => {
          reset();
          void showPlans();
        }}
        onSignedIn={() => {
          reset();
          void createLink();
        }}
        onClose={reset}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  loader: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  notice: {
    marginTop: spacing.md,
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
