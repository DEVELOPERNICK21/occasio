import { Image, StyleSheet, View } from 'react-native';
import { Text } from '../../../../shared/ui/Text';
import { TEMPLATE_OPTIONS } from '../../domain/templates';
import { colors, radius, spacing, typography } from '../../../../shared/theme/tokens';
import type { TemplateType } from '../../domain/types';

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
  const heroUri = photoUris[0];
  const hasPhoto = Boolean(heroUri);

  return (
    <View style={styles.stage}>
      <View style={styles.card}>
        <View style={styles.mediaArea}>
          {hasPhoto ? (
            <Image source={{ uri: heroUri }} style={styles.hero} resizeMode="cover" />
          ) : null}
          <View style={[styles.overlay, hasPhoto && styles.overlayOnPhoto]}>
            {templateType ? (
              <Text style={[styles.badge, hasPhoto && styles.badgeOnPhoto]}>
                {templateLabel(templateType)}
              </Text>
            ) : null}
            <Text style={[styles.recipient, hasPhoto && styles.recipientOnPhoto]}>
              {recipientName}
            </Text>
            {message ? (
              <Text style={[styles.message, hasPhoto && styles.messageOnPhoto]}>
                {message}
              </Text>
            ) : null}
          </View>
        </View>
      </View>
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
  },
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  mediaArea: {
    minHeight: 280,
    backgroundColor: colors.accentSoft,
    justifyContent: 'flex-end',
  },
  hero: {
    ...StyleSheet.absoluteFill,
  },
  overlay: {
    padding: spacing.lg,
  },
  overlayOnPhoto: {
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  badge: {
    fontSize: typography.sizeXs,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  badgeOnPhoto: {
    color: 'rgba(255,255,255,0.85)',
  },
  recipient: {
    marginTop: spacing.sm,
    fontSize: typography.sizeXl,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
  },
  recipientOnPhoto: {
    color: colors.surface,
  },
  message: {
    marginTop: spacing.sm,
    fontSize: typography.sizeMd,
    color: colors.inkSoft,
  },
  messageOnPhoto: {
    color: 'rgba(255,255,255,0.92)',
  },
  meta: {
    marginTop: spacing.md,
    fontSize: typography.sizeSm,
    color: colors.muted,
  },
});
