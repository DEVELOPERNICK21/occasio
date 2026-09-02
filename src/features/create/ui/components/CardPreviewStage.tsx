import { StyleSheet, View } from 'react-native';
import { Text } from '../../../../shared/ui/Text';
import { colors, spacing, typography } from '../../../../shared/theme/tokens';
import { templateLabel } from '../../domain/templates';
import type { TemplateType } from '../../domain/types';
import { AnimatedWishCard } from './AnimatedWishCard';

type Props = {
  recipientName: string;
  message: string;
  templateType: TemplateType | null;
  photoUris: string[];
};

export function CardPreviewStage({
  recipientName,
  message,
  templateType,
  photoUris,
}: Props) {
  return (
    <View style={styles.stage}>
      <Text style={styles.eyebrow}>Occasio</Text>
      <AnimatedWishCard
        recipientName={recipientName}
        message={message}
        templateType={templateType}
        photoUri={photoUris[0]}
        showReplay
      />
      <Text style={styles.meta}>
        {photoUris.length} photo{photoUris.length === 1 ? '' : 's'}
        {templateType ? ` · ${templateLabel(templateType)}` : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    marginTop: spacing.md,
    alignItems: 'center',
  },
  eyebrow: {
    marginBottom: spacing.md,
    fontSize: typography.sizeXs,
    fontWeight: typography.weightMedium,
    color: colors.accent,
  },
  meta: {
    marginTop: spacing.md,
    fontSize: typography.sizeSm,
    color: colors.muted,
    textAlign: 'center',
  },
});
