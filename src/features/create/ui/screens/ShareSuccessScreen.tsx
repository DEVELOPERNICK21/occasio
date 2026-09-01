import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useEffect, useState } from 'react';
import { Alert, Share, StyleSheet, View } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { AnalyticsEvents, trackEvent } from '../../../../shared/analytics/events';
import { Text } from '../../../../shared/ui/Text';
import { useRequireAuth, useAuth } from '../../../auth/application/useAuth';
import { useRecordHistory } from '../../../history/application/useHistory';
import { useCreateDraftContext } from '../../application/CreateDraftContext';
import { AnimatedWishCard } from '../components/AnimatedWishCard';
import type { CreateStackParamList, MainTabParamList } from '../../../../shared/navigation/types';
import { Button } from '../../../../shared/ui/Button';
import { Screen } from '../../../../shared/ui/Screen';
import { ScreenActions } from '../../../../shared/ui/ScreenActions';
import { colors, radius, shadow, spacing, typography } from '../../../../shared/theme/tokens';

type Props = CompositeScreenProps<
  NativeStackScreenProps<CreateStackParamList, 'ShareSuccess'>,
  BottomTabScreenProps<MainTabParamList>
>;

export function ShareSuccessScreen({ navigation, route }: Props) {
  const { draft, reset } = useCreateDraftContext();
  const { requireAuth } = useRequireAuth();
  const { isSignedIn } = useAuth();
  const { record } = useRecordHistory();
  const { shareUrl, expiresAt, creationId, shareSlug } = route.params;
  const [copied, setCopied] = useState(false);
  const expiryLabel = new Date(expiresAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  useEffect(() => {
    if (!isSignedIn || !draft.templateType) return;
    void record({
      creationId,
      shareSlug,
      shareUrl,
      expiresAt,
      recipientName: draft.recipientName.trim(),
      templateType: draft.templateType,
      message: draft.message.trim(),
    });
  }, [
    isSignedIn,
    creationId,
    shareSlug,
    shareUrl,
    expiresAt,
    draft.recipientName,
    draft.templateType,
    draft.message,
    record,
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

  const handleCopy = () => {
    try {
      Clipboard.setString(shareUrl);
      setCopied(true);
      trackEvent(AnalyticsEvents.cardShared, { channel: 'copy_link' });
    } catch {
      Alert.alert('Could not copy', 'Long-press the link below to copy manually.');
    }
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
    <Screen
      title="Link ready"
      subtitle={`Send it to ${draft.recipientName}`}
    >
      <View style={styles.previewWrap}>
        <Text style={styles.previewLabel}>Recipient preview</Text>
        <AnimatedWishCard
          recipientName={draft.recipientName}
          message={draft.message}
          templateType={draft.templateType}
          photoUri={draft.photoUris[0]}
          compact
        />
      </View>

      <View style={styles.successBadge}>
        <View style={styles.successIcon}>
          <Text style={styles.successEmoji}>✓</Text>
        </View>
        <Text style={styles.successTitle}>Your card is live</Text>
        <Text style={styles.successBody}>
          Share the link privately — only people you send it to can open it.
        </Text>
      </View>

      <View style={styles.linkBox}>
        <Text style={styles.linkLabel}>Share link</Text>
        <Text style={styles.link} selectable>
          {shareUrl}
        </Text>
        <Text style={styles.expiry}>Active until {expiryLabel}</Text>
      </View>

      <View style={styles.nudge}>
        <Text style={styles.nudgeEyebrow}>Remember them</Text>
        <Text style={styles.nudgeTitle}>Save to Vault</Text>
        <Text style={styles.nudgeBody}>
          Remember {draft.recipientName}&apos;s date and send again next year.
        </Text>
        <Button label="Save to Vault" variant="secondary" onPress={handleSaveToVault} />
      </View>

      <ScreenActions>
        <Button label="Share" onPress={handleShare} />
        <Button
          label={copied ? 'Copied!' : 'Copy link'}
          variant="secondary"
          onPress={handleCopy}
        />
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
  previewWrap: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  previewLabel: {
    marginBottom: spacing.sm,
    fontSize: typography.sizeXs,
    fontWeight: typography.weightSemibold,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  successBadge: {
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  successEmoji: {
    fontSize: 30,
    color: colors.accent,
    fontWeight: typography.weightSemibold,
  },
  successTitle: {
    marginTop: spacing.md,
    fontSize: typography.sizeLg,
    fontFamily: typography.fontDisplay,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
  },
  successBody: {
    marginTop: spacing.sm,
    fontSize: typography.sizeSm,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: typography.sizeSm * 1.45,
    maxWidth: 280,
  },
  linkBox: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow.card,
  },
  linkLabel: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightSemibold,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  link: {
    marginTop: spacing.sm,
    fontSize: typography.sizeSm,
    color: colors.accent,
    lineHeight: typography.sizeSm * 1.5,
  },
  expiry: {
    marginTop: spacing.sm,
    fontSize: typography.sizeXs,
    color: colors.muted,
  },
  nudge: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.sidebar,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  nudgeEyebrow: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightSemibold,
    color: colors.accent,
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
  },
});
