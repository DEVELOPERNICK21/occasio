import { ImageBackground, StyleSheet, View } from 'react-native';
import { colors, radius, shadow, spacing, typography } from '../../../../../shared/theme/tokens';
import { Text } from '../../../../../shared/ui/Text';
import type { LayoutProps } from '../TemplateRenderer';
import { useCardReveal } from '../useCardReveal';
import { CardDivider } from './CardDivider';
import { RevealBlock } from './RevealBlock';

/**
 * Full photo — cinematic letter on photo, staged reveal.
 */
export function MinimalFullscreen({
  photoUris,
  recipientName,
  headline,
  body,
  fromName,
  compact = false,
  replayKey = 0,
  animate = true,
}: LayoutProps) {
  const photoUri = photoUris[0];
  const displayName = recipientName.trim() || 'Their name';
  const signOff = fromName?.trim();
  const reveal = useCardReveal(replayKey, animate && !compact);

  const letter = (
    <View style={[styles.letter, compact && styles.letterCompact]}>
      <RevealBlock animatedStyle={reveal.occasionStyle} style={styles.center}>
        {headline ? <Text style={styles.headline}>{headline}</Text> : null}
        <CardDivider />
      </RevealBlock>
      <RevealBlock animatedStyle={reveal.nameStyle} style={styles.center}>
        <Text style={[styles.name, compact && styles.nameCompact]}>{displayName}</Text>
      </RevealBlock>
      <RevealBlock animatedStyle={reveal.messageStyle} style={styles.center}>
        {body ? <Text style={styles.body}>{body}</Text> : null}
        {signOff ? <Text style={styles.signOff}>With love, {signOff}</Text> : null}
      </RevealBlock>
    </View>
  );

  return (
    <View style={[styles.card, compact && styles.cardCompact, shadow.card]}>
      {photoUri ? (
        <RevealBlock animatedStyle={reveal.photoStyle} style={styles.photoWrap}>
          <ImageBackground source={{ uri: photoUri }} style={styles.photo} resizeMode="cover">
            <View style={styles.scrim} />
            {letter}
          </ImageBackground>
        </RevealBlock>
      ) : (
        <View style={styles.fallback}>{letter}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    aspectRatio: 4 / 5,
    overflow: 'hidden',
    backgroundColor: colors.sidebar,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
  },
  cardCompact: {
    maxWidth: 280,
  },
  photoWrap: {
    flex: 1,
  },
  photo: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(42, 34, 32, 0.28)',
  },
  fallback: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.accentSoft,
  },
  letter: {
    margin: spacing.md,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  letterCompact: {
    margin: spacing.sm,
    padding: spacing.sm,
  },
  center: {
    alignItems: 'center',
    width: '100%',
  },
  headline: {
    color: colors.accent,
    fontFamily: typography.fontBody,
    fontSize: typography.sizeXs,
    fontWeight: typography.weightMedium,
    letterSpacing: 1.2,
    lineHeight: typography.sizeXs * 1.4,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  name: {
    color: colors.ink,
    fontFamily: typography.fontDisplay,
    fontSize: typography.sizeXl,
    fontWeight: typography.weightSemibold,
    letterSpacing: -0.3,
    lineHeight: typography.sizeXl * 1.12,
    textAlign: 'center',
  },
  nameCompact: {
    fontSize: typography.sizeLg,
    lineHeight: typography.sizeLg * 1.12,
  },
  body: {
    marginTop: spacing.sm,
    color: colors.inkSoft,
    fontFamily: typography.fontBody,
    fontSize: typography.sizeSm,
    lineHeight: typography.sizeSm * 1.55,
    textAlign: 'center',
  },
  signOff: {
    marginTop: spacing.md,
    color: colors.ink,
    fontSize: typography.sizeXs,
    fontWeight: typography.weightSemibold,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
});
