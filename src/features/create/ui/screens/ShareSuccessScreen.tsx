import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Share, StyleSheet, View } from 'react-native';
import { AnalyticsEvents, trackEvent } from '../../../../shared/analytics/events';
import { Text } from '../../../../shared/ui/Text';
import { useRequireAuth, useAuth } from '../../../auth/application/useAuth';
import { useQueueGuestHistory, useRecordHistory } from '../../../history/application/useHistory';
import { useLinkCreationToPerson } from '../../../vault/application/useLinkCreationToPerson';
import { useVaultPeople } from '../../../vault/application/useVaultPeople';
import { useCreateDraftContext } from '../../application/CreateDraftContext';
import { useTemplateCatalog } from '../../application/useTemplateCatalog';
import { shareMessage } from '../../domain/shareLink';
import { getTemplateTheme } from '../../domain/templateTheme';
import { AnimatedWishCard } from '../components/AnimatedWishCard';
import { OccasionStickerShower } from '../components/OccasionStickerShower';
import { ShareLinkPanel } from '../components/ShareLinkPanel';
import { TemplateRenderer } from '../components/TemplateRenderer';
import type {
  CreateStackParamList,
  LinkCreationParam,
  MainTabParamList,
} from '../../../../shared/navigation/types';
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
  const { getById } = useTemplateCatalog();
  const { people } = useVaultPeople(isSignedIn);
  const { link, isSaving: isLinking, error: linkError } = useLinkCreationToPerson();
  const { shareUrl, expiresAt, creationId, shareSlug } = route.params;
  const [copied, setCopied] = useState(false);
  const theme = useMemo(() => getTemplateTheme(draft.templateType), [draft.templateType]);
  const definition = draft.templateId ? getById(draft.templateId) : null;

  const subtitle = draft.recipientName.trim()
    ? `${theme.label} wish for ${draft.recipientName.trim()}`
    : `Your ${theme.label.toLowerCase()} wish`;
  const sendLabel = draft.recipientName.trim()
    ? `Send to ${draft.recipientName.trim()}`
    : 'Send the link';

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
        // Written to the recipient, and the URL sits last so chat apps attach
        // the preview to it.
        message: `${shareMessage(draft.recipientName, draft.fromName)} ${shareUrl}`,
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

  const linkCreation: LinkCreationParam = {
    creationId,
    templateType: draft.templateType,
    templateId: draft.templateId,
    photoRefs: [],
    message: draft.message.trim(),
    fromName: draft.fromName.trim() || null,
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
    <Screen title="Your link is ready" subtitle={subtitle}>
      <View style={styles.previewStage}>
        <View style={styles.cardLayer}>
          {definition ? (
            <TemplateRenderer
              definition={definition}
              occasion={draft.occasion}
              photoUris={draft.photoUris}
              recipientName={draft.recipientName}
              message={draft.message}
              fromName={draft.fromName}
              replayKey={0}
            />
          ) : (
            <AnimatedWishCard
              recipientName={draft.recipientName}
              message={draft.message}
              templateType={draft.templateType}
              photoUri={draft.photoUris[0]}
              showReplay
            />
          )}
        </View>
        <OccasionStickerShower
          occasion={draft.occasion}
          templateType={draft.templateType}
          height={380}
        />
      </View>

      <ShareLinkPanel
        shareUrl={shareUrl}
        expiresAt={expiresAt}
        theme={theme}
        copied={copied}
        onCopied={handleCopied}
      />

      <ScreenActions>
        <Button label={sendLabel} onPress={handleShare} />
      </ScreenActions>

      <View style={[styles.nudge, { borderColor: theme.accent }]}>
        <Text style={[styles.nudgeEyebrow, { color: theme.accent }]}>
          Remember them
        </Text>
        <Text style={styles.nudgeTitle}>Save to Vault</Text>
        <Text style={styles.nudgeBody}>
          Keep {draft.recipientName.trim() || 'their'} date and send again next year.
        </Text>
        <Button label="Save to Vault" variant="secondary" onPress={handleSaveToVault} />
        <Button
          label="Save for auto-send"
          variant="secondary"
          loading={isLinking}
          onPress={handleSaveForAutoSend}
        />
        {linkError ? <Text style={styles.nudgeError}>{linkError}</Text> : null}
      </View>

      <ScreenActions>
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
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    overflow: 'visible',
    width: '100%',
    minHeight: 360,
  },
  cardLayer: {
    width: '100%',
    zIndex: 1,
    elevation: 1,
    alignItems: 'center',
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
  nudgeError: {
    fontSize: typography.sizeSm,
    color: colors.error,
  },
});
