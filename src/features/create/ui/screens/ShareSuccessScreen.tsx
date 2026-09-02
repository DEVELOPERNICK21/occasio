import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useEffect, useMemo, useState } from 'react';
import { Share, StyleSheet, View } from 'react-native';
import { AnalyticsEvents, trackEvent } from '../../../../shared/analytics/events';
import { Text } from '../../../../shared/ui/Text';
import { useRequireAuth, useAuth } from '../../../auth/application/useAuth';
import { useQueueGuestHistory, useRecordHistory } from '../../../history/application/useHistory';
import { useCreateDraftContext } from '../../application/CreateDraftContext';
import { getTemplateTheme } from '../../domain/templateTheme';
import { AnimatedWishCard } from '../components/AnimatedWishCard';
import { ShareLinkPanel } from '../components/ShareLinkPanel';
import type { CreateStackParamList, MainTabParamList } from '../../../../shared/navigation/types';
import { Button } from '../../../../shared/ui/Button';
import { Screen } from '../../../../shared/ui/Screen';
import { ScreenActions } from '../../../../shared/ui/ScreenActions';
import { colors, radius, spacing, typography } from '../../../../shared/theme/tokens';

type Props = CompositeScreenProps<
  NativeStackScreenProps<CreateStackParamList, 'ShareSuccess'>,
  BottomTabScreenProps<MainTabParamList>
>;

export function ShareSuccessScreen({ navigation, route }: Props) {
  const { draft, reset } = useCreateDraftContext();
  const { requireAuth } = useRequireAuth();
  const { isSignedIn } = useAuth();
  const { record } = useRecordHistory();
  const { queue } = useQueueGuestHistory();
  const { shareUrl, expiresAt, creationId, shareSlug } = route.params;
  const [copied, setCopied] = useState(false);
  const theme = useMemo(() => getTemplateTheme(draft.templateType), [draft.templateType]);

  const subtitle = draft.recipientName.trim()
    ? `${theme.label} wish for ${draft.recipientName.trim()}`
    : `Your ${theme.label.toLowerCase()} wish`;

  useEffect(() => {
    if (!draft.templateType) return;

    const input = {
      creationId,
      shareSlug,
      shareUrl,
      expiresAt,
      recipientName: draft.recipientName.trim(),
      templateType: draft.templateType,
      message: draft.message.trim(),
    };

    if (isSignedIn) {
      void record(input);
      return;
    }

    void queue(input);
  }, [
    creationId,
    shareSlug,
    shareUrl,
    expiresAt,
    draft.recipientName,
    draft.templateType,
    draft.message,
    isSignedIn,
    record,
    queue,
  ]);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `A wish for ${draft.recipientName}: ${shareUrl}`,
        url: shareUrl,
      });
      trackEvent(AnalyticsEvents.cardShared, { channel: 'native_share' });
    } catch {
      // User cancelled share sheet
    }
  };

  const handleCopied = () => {
    setCopied(true);
    trackEvent(AnalyticsEvents.cardShared, { channel: 'copy_link' });
  };

  const handleSaveToVault = () => {
    requireAuth('vault_save', () => {
      navigation.navigate('VaultTab', {
        screen: 'AddPerson',
        params: { prefilledName: draft.recipientName },
      });
    });
  };

  return (
    <Screen title="Your link is ready" subtitle={subtitle}>
      <View style={styles.previewStage}>
        <AnimatedWishCard
          recipientName={draft.recipientName}
          message={draft.message}
          templateType={draft.templateType}
          photoUri={draft.photoUris[0]}
          showReplay
        />
      </View>

      <ShareLinkPanel
        shareUrl={shareUrl}
        expiresAt={expiresAt}
        theme={theme}
        copied={copied}
        onCopied={handleCopied}
      />

      <View style={[styles.nudge, { borderColor: theme.accent }]}>
        <Text style={[styles.nudgeEyebrow, { color: theme.accent }]}>
          Remember them
        </Text>
        <Text style={styles.nudgeTitle}>Save to Vault</Text>
        <Text style={styles.nudgeBody}>
          Keep {draft.recipientName.trim() || 'their'} date and send again next year.
        </Text>
        <Button label="Save to Vault" variant="secondary" onPress={handleSaveToVault} />
      </View>

      <ScreenActions>
        <Button label="Share link" onPress={handleShare} />
        <Button
          label="Create another"
          variant="ghost"
          onPress={() => {
            reset();
            navigation.popToTop();
          }}
        />
      </ScreenActions>
    </Screen>
  );
}

const styles = StyleSheet.create({
  previewStage: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  nudge: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.sidebar,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.xs,
  },
  nudgeEyebrow: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightSemibold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  nudgeTitle: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
  },
  nudgeBody: {
    fontSize: typography.sizeSm,
    color: colors.inkSoft,
    lineHeight: typography.sizeSm * 1.4,
    marginBottom: spacing.sm,
  },
});
