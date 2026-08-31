import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Share, StyleSheet, View } from 'react-native';
import { Text } from '../../../../shared/ui/Text';
import { useCreateDraftContext } from '../../application/CreateDraftContext';
import type { CreateStackParamList } from '../../../../shared/navigation/types';
import { Button } from '../../../../shared/ui/Button';
import { Screen } from '../../../../shared/ui/Screen';
import { colors, radius, spacing, typography } from '../../../../shared/theme/tokens';

type Props = NativeStackScreenProps<CreateStackParamList, 'ShareSuccess'>;

export function ShareSuccessScreen({ navigation, route }: Props) {
  const { draft, reset } = useCreateDraftContext();
  const { shareUrl, expiresAt } = route.params;
  const expiryLabel = new Date(expiresAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const handleShare = async () => {
    try {
      await Share.share({
        message: `A wish for you: ${shareUrl}`,
        url: shareUrl,
      });
    } catch {
      // User cancelled share sheet
    }
  };

  return (
    <Screen
      title="Link ready"
      subtitle="Share with your person"
      footer={
        <View style={styles.footerStack}>
          <Button label="Share" onPress={handleShare} />
          <Button
            label="Create another"
            variant="secondary"
            onPress={() => {
              reset();
              navigation.popToTop();
            }}
          />
        </View>
      }
    >
      <View style={styles.linkBox}>
        <Text style={styles.link} selectable>
          {shareUrl}
        </Text>
        <Text style={styles.expiry}>Link works until {expiryLabel}</Text>
      </View>
      <View style={styles.nudge}>
        <Text style={styles.nudgeTitle}>Save to Vault?</Text>
        <Text style={styles.nudgeBody}>
          Never miss {draft.recipientName}&apos;s date next year.
        </Text>
        <Button label="Save person" variant="secondary" onPress={() => {}} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  linkBox: {
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  link: {
    fontSize: typography.sizeSm,
    color: colors.accent,
  },
  expiry: {
    marginTop: spacing.sm,
    fontSize: typography.sizeXs,
    color: colors.muted,
  },
  nudge: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.accentSoft,
    borderRadius: radius.lg,
    gap: spacing.sm,
  },
  nudgeTitle: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
  },
  nudgeBody: {
    fontSize: typography.sizeSm,
    color: colors.inkSoft,
    marginBottom: spacing.sm,
  },
  footerStack: {
    gap: spacing.sm,
  },
});
