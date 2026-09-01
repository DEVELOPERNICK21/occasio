import { StyleSheet, View } from 'react-native';
import { Text } from '../../../../shared/ui/Text';
import { TEMPLATE_OPTIONS } from '../../domain/templates';
import { colors, spacing, typography } from '../../../../shared/theme/tokens';
import type { TemplateType } from '../../domain/types';
import { AnimatedWishCard } from './AnimatedWishCard';

type Props = {
  recipientName: string;
  message: string;
  templateType: TemplateType | null;
  photoUris: string[];
};

function templateLabel(templateType: TemplateType): string {
  return TEMPLATE_OPTIONS.find((t) => t.id === templateType)?.label ?? 'Special wish';
}

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
    fontWeight: typography.weightSemibold,
    color: colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
  meta: {
    marginTop: spacing.md,
    fontSize: typography.sizeSm,
    color: colors.muted,
    textAlign: 'center',
  },
});
