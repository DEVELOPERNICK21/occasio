import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { Text } from '../../../../shared/ui/Text';
import { useCreateDraftContext } from '../../application/CreateDraftContext';
import { useCreateShareLink } from '../../application/useCreateShareLink';
import { CardPreviewStage } from '../components/CardPreviewStage';
import type { CreateStackParamList } from '../../../../shared/navigation/types';
import { Button } from '../../../../shared/ui/Button';
import { Screen } from '../../../../shared/ui/Screen';
import { colors, spacing, typography } from '../../../../shared/theme/tokens';

type Props = NativeStackScreenProps<CreateStackParamList, 'Preview'>;

export function PreviewScreen({ navigation }: Props) {
  const { draft } = useCreateDraftContext();
  const { generate, isLoading, error, paywallRequired } = useCreateShareLink();

  const handleGenerate = async () => {
    const result = await generate(draft);
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
      {paywallRequired ? (
        <Text style={styles.paywall}>
          Free limit reached — upgrade or buy one card (paywall UI next).
        </Text>
      ) : null}
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
  },
  paywall: {
    marginTop: spacing.md,
    color: colors.accent,
    fontSize: typography.sizeSm,
    fontWeight: typography.weightMedium,
  },
});
