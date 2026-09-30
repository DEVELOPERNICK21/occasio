import { Image, StyleSheet, View } from 'react-native';
import { colors, radius, shadow, spacing, typography } from '../../../../../shared/theme/tokens';
import { Text } from '../../../../../shared/ui/Text';
import type { LayoutProps } from '../TemplateRenderer';
import { useCardReveal } from '../useCardReveal';
import { RevealBlock } from './RevealBlock';

/**
 * Poster — bold headline and name set above and below one photo.
 */
export function PosterType({
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
  const bigSize = compact ? typography.sizeXl : 44;

  return (
    <View style={[styles.card, compact && styles.cardCompact, shadow.card]}>
      <View style={styles.poster}>
        <RevealBlock animatedStyle={reveal.occasionStyle}>
          <Text
            style={[styles.big, { fontSize: bigSize, lineHeight: bigSize * 0.98 }]}
            numberOfLines={2}
            adjustsFontSizeToFit
          >
            {headline.toUpperCase()}
          </Text>
        </RevealBlock>
        <RevealBlock animatedStyle={reveal.photoStyle} style={styles.photoWrap}>
          {photo ? (
            <Image source={{ uri: photo }} style={styles.photo} resizeMode="cover" />
          ) : (
            <View style={styles.photoFallback} />
          )}
        </RevealBlock>
        <RevealBlock animatedStyle={reveal.nameStyle}>
          <Text
            style={[styles.big, { fontSize: bigSize, lineHeight: bigSize * 0.98 }]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {displayName.toUpperCase()}
          </Text>
        </RevealBlock>
      </View>
      <RevealBlock animatedStyle={reveal.messageStyle} style={styles.band}>
        {body ? <Text style={styles.body}>{body}</Text> : null}
        {signOff ? <Text style={styles.signOff}>With love, {signOff}</Text> : null}
      </RevealBlock>
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
  poster: {
    aspectRatio: 4 / 5,
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  big: {
    color: colors.white,
    fontFamily: typography.fontDisplay,
    fontWeight: '800',
    letterSpacing: -1,
  },
  photoWrap: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: radius.sm,
    backgroundColor: colors.accentHover,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoFallback: {
    flex: 1,
    backgroundColor: colors.accentSoft,
  },
  band: {
    alignItems: 'center',
    backgroundColor: colors.sidebar,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  body: {
    maxWidth: 300,
    color: colors.inkSoft,
    fontFamily: typography.fontBody,
    fontSize: typography.sizeMd,
    lineHeight: typography.sizeMd * 1.6,
    textAlign: 'center',
  },
  signOff: {
    marginTop: spacing.md,
    color: colors.ink,
    fontSize: typography.sizeSm,
    fontWeight: typography.weightSemibold,
    textAlign: 'center',
  },
});
