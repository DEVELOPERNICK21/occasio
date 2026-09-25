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
import { countWishesThisMonth } from '../../domain/createHome';
import {
  isInteractiveExperience,
  resolveDraftExperienceMode,
  storyBeatHint,
} from '../../domain/experienceMode';
import { freeQuotaNotice } from '../../domain/quota';
import { CardPreviewStage } from '../components/CardPreviewStage';
import type { CreateStackParamList } from '../../../../shared/navigation/types';
import { Button } from '../../../../shared/ui/Button';
import { Screen } from '../../../../shared/ui/Screen';
import { ScreenActions } from '../../../../shared/ui/ScreenActions';
import { colors, spacing, typography } from '../../../../shared/theme/tokens';
import { getCreateStep } from '../createSteps';

type Props = NativeStackScreenProps<CreateStackParamList, 'Preview'>;

export function PreviewScreen({ navigation }: Props) {
  const { draft, isEditing, clearEditing } = useCreateDraftContext();
  const { isSignedIn } = useAuth();
  const { entries } = useHistory(isSignedIn);
  const { open: openPaywall, isConfigured, tier, error: billingError } = usePaywall();
  const cardsCreatedThisMonth = useMemo(
    () => (isSignedIn ? countWishesThisMonth(entries) : 0),
    [entries, isSignedIn],
  );
  const { generate, isLoading, error, paywallRequired, reset } =
    useCreateShareLink({
      cardsCreatedThisMonth,
      tier,
    });
  const quotaNotice = isEditing
    ? null
    : freeQuotaNotice(cardsCreatedThisMonth, tier);

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
        'Upgrade needed',
        'Billing is not ready yet. Add your RevenueCat offering (monthly / yearly / lifetime) and rebuild.',
      );
      reset();
      return;
    }

    void openPaywall().then((result) => {
      reset();
      if (result === 'purchased' || result === 'restored') {
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
      }
    });
  }, [
    paywallRequired,
    isEditing,
    isConfigured,
    openPaywall,
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

  const handleGenerate = async () => {
    if (paywallRequired && !isEditing) {
      if (!isConfigured) {
        Alert.alert(
          'Upgrade needed',
          'Billing is not ready yet. Configure RevenueCat products and try again.',
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
      step={getCreateStep('preview', !draft.audience)}
      onBack={() => navigation.goBack()}
    >
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
          onPress={() => void handleGenerate()}
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
