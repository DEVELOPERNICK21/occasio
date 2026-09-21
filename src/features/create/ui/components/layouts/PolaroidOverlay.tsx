import { Image, StyleSheet, View } from 'react-native';
import { colors, radius, shadow, spacing } from '../../../../../shared/theme/tokens';
import type { LayoutProps } from '../TemplateRenderer';
import { useCardReveal } from '../useCardReveal';
import { CollageLetterBand } from './CollageLetterBand';
import { RevealBlock } from './RevealBlock';

/**
 * Snapshot — full-bleed photo with a small inset “polaroid” on top.
 */
export function PolaroidOverlay({
  photoUris,
  recipientName,
  headline,
  body,
  fromName,
  compact = false,
  replayKey = 0,
  animate = true,
}: LayoutProps) {
  const primary = photoUris[0];
  const inset = photoUris[1];
  const displayName = recipientName.trim() || 'Their name';
  const signOff = fromName?.trim();
  const reveal = useCardReveal(replayKey, animate && !compact);

  return (
    <View style={[styles.card, compact && styles.cardCompact, shadow.card]}>
      <RevealBlock animatedStyle={reveal.photoStyle}>
        <View style={styles.stage}>
          <View style={styles.base}>
            {primary ? (
              <Image source={{ uri: primary }} style={styles.photo} resizeMode="cover" />
            ) : (
              <View style={styles.baseFallback} />
            )}
          </View>
          <View style={styles.insetWrap}>
            <View style={styles.inset}>
              {inset ? (
                <Image source={{ uri: inset }} style={styles.photo} resizeMode="cover" />
              ) : (
                <View style={styles.insetFallback} />
              )}
            </View>
          </View>
        </View>
      </RevealBlock>
      <CollageLetterBand
        headline={headline}
        displayName={displayName}
        body={body}
        signOff={signOff}
        compact={compact}
        reveal={reveal}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
  },
  cardCompact: {
    maxWidth: 280,
  },
  stage: {
    aspectRatio: 4 / 5,
    backgroundColor: colors.sidebar,
    padding: spacing.sm,
  },
  base: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
  },
  baseFallback: {
    flex: 1,
    backgroundColor: colors.accentSoft,
  },
  insetWrap: {
    position: 'absolute',
    top: spacing.lg + spacing.sm,
    right: spacing.md + spacing.sm,
    width: '38%',
    aspectRatio: 3 / 4,
    transform: [{ rotate: '4deg' }],
  },
  inset: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: radius.sm,
    borderWidth: 3,
    borderColor: colors.surface,
    backgroundColor: colors.border,
    ...shadow.card,
  },
  insetFallback: {
    flex: 1,
    backgroundColor: colors.border,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
});
