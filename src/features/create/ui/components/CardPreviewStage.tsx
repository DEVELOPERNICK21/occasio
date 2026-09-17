import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../../../../shared/ui/Text';
import { colors, spacing, typography } from '../../../../shared/theme/tokens';
import { useTemplateCatalog } from '../../application/useTemplateCatalog';
import { getTemplateTheme } from '../../domain/templateTheme';
import { templateLabel } from '../../domain/templates';
import type { Occasion } from '../../domain/templateSchema';
import type { TemplateType } from '../../domain/types';
import { AnimatedWishCard } from './AnimatedWishCard';
import { OccasionStickerShower } from './OccasionStickerShower';
import { TemplateRenderer } from './TemplateRenderer';

type Props = {
  recipientName: string;
  message: string;
  occasion: Occasion | null;
  templateType: TemplateType | null;
  templateId: string | null;
  photoUris: string[];
  fromName?: string;
};

export function CardPreviewStage({
  recipientName,
  message,
  occasion,
  templateType,
  templateId,
  photoUris,
  fromName,
}: Props) {
  const { getById } = useTemplateCatalog();
  const definition = templateId ? getById(templateId) : null;
  const theme = getTemplateTheme(templateType ?? occasion);
  const [replayKey, setReplayKey] = useState(0);

  return (
    <View style={styles.stage}>
      <View style={styles.showerStage}>
        <View style={styles.cardLayer}>
          {definition ? (
            <TemplateRenderer
              key={replayKey}
              definition={definition}
              occasion={occasion}
              photoUris={photoUris}
              recipientName={recipientName}
              message={message}
              fromName={fromName}
              replayKey={replayKey}
            />
          ) : (
            <AnimatedWishCard
              recipientName={recipientName}
              message={message}
              templateType={templateType}
              photoUri={photoUris[0]}
            />
          )}
        </View>
        {/* After the card in the tree so Android elevation paints it on top */}
        <OccasionStickerShower
          occasion={occasion}
          templateType={templateType}
          height={440}
          replayKey={replayKey}
        />
      </View>
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Replay"
          onPress={() => setReplayKey((k) => k + 1)}
          style={styles.replayBtn}
        >
          <Text style={[styles.replayLabel, { color: theme.accent }]}>
            Replay
          </Text>
        </Pressable>
        <Text style={styles.meta}>
          {photoUris.length} photo{photoUris.length === 1 ? '' : 's'}
          {definition
            ? ` · ${definition.title}`
            : templateType
              ? ` · ${templateLabel(templateType)}`
              : ''}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    marginTop: spacing.sm,
    alignItems: 'center',
  },
  showerStage: {
    width: '100%',
    minHeight: 420,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  cardLayer: {
    width: '100%',
    zIndex: 1,
    elevation: 1,
  },
  actions: {
    marginTop: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  replayBtn: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  replayLabel: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightMedium,
    letterSpacing: 0.2,
  },
  meta: {
    fontSize: typography.sizeXs,
    color: colors.muted,
    lineHeight: typography.sizeXs * 1.4,
    textAlign: 'center',
  },
});
