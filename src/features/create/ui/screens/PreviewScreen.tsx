import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Text } from '../../../../shared/ui/Text';
import { useCreateDraftContext } from '../../application/CreateDraftContext';
import { useCreateShareLink } from '../../application/useCreateShareLink';
import type { CreateStackParamList } from '../../../../shared/navigation/types';
import { Button } from '../../../../shared/ui/Button';
import { Screen } from '../../../../shared/ui/Screen';
import { colors, radius, spacing, typography } from '../../../../shared/theme/tokens';

type Props = NativeStackScreenProps<CreateStackParamList, 'Preview'>;

export function PreviewScreen({ navigation }: Props) {
  const { draft } = useCreateDraftContext();
  const { generate, isLoading, error, paywallRequired } = useCreateShareLink();

  const handleGenerate = async () => {
    const result = await generate(draft);
    if (paywallRequired) {
      // Phase 4: navigate to paywall modal
      return;
    }
    if (result) {
      navigation.navigate('ShareSuccess', {
        shareUrl: result.shareUrl,
        expiresAt: result.expiresAt,
      });
    }
  };

  return (
    <Screen
      title="Preview"
      subtitle="How it will look"
      footer={
        <Button
          label={isLoading ? 'Generating…' : 'Generate link'}
          disabled={isLoading}
          onPress={handleGenerate}
        />
      }
    >
      <View style={styles.stage}>
        <Text style={styles.stageLabel}>Animated template preview</Text>
        <Text style={styles.recipient}>For {draft.recipientName}</Text>
        {draft.message ? (
          <Text style={styles.message}>{draft.message}</Text>
        ) : null}
        <Text style={styles.meta}>
          {draft.photoUris.length} photo(s) · {draft.templateType}
        </Text>
      </View>
      {isLoading ? (
        <ActivityIndicator style={styles.loader} color={colors.accent} />
      ) : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {paywallRequired ? (
        <Text style={styles.paywall}>
          Free limit reached — upgrade or buy one card (paywall UI next).
        </Text>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  stage: {
    marginTop: spacing.md,
    minHeight: 280,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  stageLabel: {
    fontSize: typography.sizeSm,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  recipient: {
    marginTop: spacing.md,
    fontSize: typography.sizeXl,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
  },
  message: {
    marginTop: spacing.sm,
    fontSize: typography.sizeMd,
    color: colors.inkSoft,
  },
  meta: {
    marginTop: spacing.lg,
    fontSize: typography.sizeSm,
    color: colors.muted,
  },
  loader: {
    marginTop: spacing.lg,
  },
  error: {
    marginTop: spacing.md,
    color: colors.error,
    fontSize: typography.sizeSm,
  },
  paywall: {
    marginTop: spacing.md,
    color: colors.accent,
    fontSize: typography.sizeSm,
    fontWeight: typography.weightMedium,
  },
});
