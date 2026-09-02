import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { AnalyticsEvents, trackEvent } from '../../../../shared/analytics/events';
import { Text } from '../../../../shared/ui/Text';
import { useCreateDraftContext } from '../../application/CreateDraftContext';
import { useCreateShareLink } from '../../application/useCreateShareLink';
import { CardPreviewStage } from '../components/CardPreviewStage';
import { PaywallModal } from '../components/PaywallModal';
import type { CreateStackParamList } from '../../../../shared/navigation/types';
import { Screen } from '../../../../shared/ui/Screen';
import { ScreenHeaderAction } from '../../../../shared/ui/ScreenHeaderAction';
import { colors, spacing, typography } from '../../../../shared/theme/tokens';

type Props = NativeStackScreenProps<CreateStackParamList, 'Preview'>;

export function PreviewScreen({ navigation }: Props) {
  const { draft } = useCreateDraftContext();
  const { generate, isLoading, error, paywallRequired } = useCreateShareLink();
  const [paywallOpen, setPaywallOpen] = useState(false);

  useEffect(() => {
    trackEvent(AnalyticsEvents.previewOpened, {
      templateType: draft.templateType ?? undefined,
    });
  }, [draft.templateType]);

  useEffect(() => {
    if (paywallRequired) {
      setPaywallOpen(true);
      trackEvent(AnalyticsEvents.paywallShown);
    }
  }, [paywallRequired]);

  const handleGenerate = async () => {
    if (paywallRequired) {
      setPaywallOpen(true);
      return;
    }

    const result = await generate(draft);
    if (result) {
      trackEvent(AnalyticsEvents.cardShared, { shareSlug: result.shareSlug });
      navigation.navigate('ShareSuccess', {
        shareUrl: result.shareUrl,
        expiresAt: result.expiresAt,
        creationId: result.creationId,
        shareSlug: result.shareSlug,
      });
    } else if (error) {
      trackEvent(AnalyticsEvents.uploadFailed, { message: error });
    }
  };

  return (
    <>
      <Screen
        title="Preview"
        subtitle="How it will look"
        step={{ current: 4, total: 4 }}
        onBack={() => navigation.goBack()}
        headerAction={
          <ScreenHeaderAction
            label={isLoading ? 'Generating…' : 'Generate link'}
            disabled={isLoading}
            onPress={() => void handleGenerate()}
          />
        }
      >
        <CardPreviewStage
          recipientName={draft.recipientName}
          message={draft.message}
          templateType={draft.templateType}
          photoUris={draft.photoUris}
        />
        {isLoading ? (
          <ActivityIndicator style={styles.loader} color={colors.accent} />
        ) : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Text style={styles.hint}>
          Your link will be private and unlisted — only people you share it with can open it.
        </Text>
      </Screen>
      <PaywallModal visible={paywallOpen} onClose={() => setPaywallOpen(false)} />
    </>
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
    marginTop: spacing.lg,
    fontSize: typography.sizeSm,
    color: colors.muted,
    lineHeight: typography.sizeSm * 1.4,
  },
});
