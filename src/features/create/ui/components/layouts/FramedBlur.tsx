import { Image, StyleSheet, View } from 'react-native';
import { colors, radius, shadow, spacing, typography } from '../../../../../shared/theme/tokens';
import { Text } from '../../../../../shared/ui/Text';
import type { LayoutProps } from '../TemplateRenderer';
import { useCardReveal } from '../useCardReveal';
import { CollageLetterBand } from './CollageLetterBand';
import { RevealBlock } from './RevealBlock';

/**
 * Framed — the photo floats in a white mount over a soft blur of itself.
 */
export function FramedBlur({
  photoUris,
  recipientName,
  headline,
  body,
  fromName,
  compact = false,
  replayKey = 0,
  animate = true,
}: LayoutProps) {
  const photo = photoUris[0];
  const displayName = recipientName.trim() || 'Their name';
  const signOff = fromName?.trim();
  const reveal = useCardReveal(replayKey, animate && !compact);

  return (
    <View style={[styles.card, compact && styles.cardCompact, shadow.card]}>
      <RevealBlock animatedStyle={reveal.photoStyle}>
        <View style={styles.stage}>
          {photo ? (
            <Image
              source={{ uri: photo }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
              blurRadius={compact ? 12 : 22}
            />
          ) : null}
          <View style={styles.veil} />
          <View style={styles.mount}>
            <View style={styles.photoBox}>
              {photo ? (
                <Image source={{ uri: photo }} style={styles.photo} resizeMode="cover" />
              ) : (
                <View style={styles.photoFallback} />
              )}
            </View>
            {headline ? (
              <Text style={styles.caption} numberOfLines={1}>
                {headline}
              </Text>
            ) : null}
          </View>
        </View>
      </RevealBlock>
      <CollageLetterBand
        headline=""
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
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentSoft,
    overflow: 'hidden',
  },
  veil: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.white,
    opacity: 0.18,
  },
  mount: {
    width: '64%',
    padding: spacing.sm,
    paddingBottom: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: 3,
    ...shadow.card,
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 8,
  },
  photoBox: {
    aspectRatio: 4 / 5,
    overflow: 'hidden',
    backgroundColor: colors.border,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoFallback: {
    flex: 1,
    backgroundColor: colors.accentSoft,
  },
  caption: {
    marginTop: spacing.xs,
    marginBottom: 2,
    color: colors.accent,
    fontFamily: typography.fontBody,
    fontSize: 10,
    fontWeight: typography.weightMedium,
    letterSpacing: 1,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
});
