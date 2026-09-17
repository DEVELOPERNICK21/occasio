import { Image, StyleSheet, View } from 'react-native';
import { colors, radius, shadow, spacing, typography } from '../../../../../shared/theme/tokens';
import { Text } from '../../../../../shared/ui/Text';
import type { LayoutProps } from '../TemplateRenderer';
import { useCardReveal } from '../useCardReveal';
import { CardDivider } from './CardDivider';
import { RevealBlock } from './RevealBlock';

/**
 * Letter & photo — emotional invitation with staged reveal:
 * photo → occasion → name → message / sign-off.
 */
export function EditorialPortrait({
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

  return (
    <View style={[styles.card, compact && styles.cardCompact, shadow.card]}>
      <RevealBlock animatedStyle={reveal.photoStyle}>
        <View style={[styles.hero, compact && styles.heroCompact]}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.photo} resizeMode="cover" />
          ) : (
            <View style={styles.photoFallback} />
          )}
          <View style={styles.heroFade} />
        </View>
      </RevealBlock>
      <View style={[styles.copy, compact && styles.copyCompact]}>
        <RevealBlock animatedStyle={reveal.occasionStyle} style={styles.center}>
          {headline ? <Text style={styles.headline}>{headline}</Text> : null}
          <CardDivider />
        </RevealBlock>
        <RevealBlock animatedStyle={reveal.nameStyle} style={styles.center}>
          <Text style={[styles.name, compact && styles.nameCompact]}>{displayName}</Text>
        </RevealBlock>
        <RevealBlock animatedStyle={reveal.messageStyle} style={styles.center}>
          {body ? <Text style={styles.body}>{body}</Text> : null}
          {signOff ? (
            <View style={styles.signOffWrap}>
              <Text style={styles.signOffLabel}>With love</Text>
              <Text style={styles.signOffName}>{signOff}</Text>
            </View>
          ) : null}
        </RevealBlock>
      </View>
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
  center: {
    alignItems: 'center',
    width: '100%',
  },
  hero: {
    aspectRatio: 5 / 4,
    backgroundColor: colors.sidebar,
  },
  heroCompact: {
    aspectRatio: 4 / 3,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoFallback: {
    flex: 1,
    backgroundColor: colors.accentSoft,
  },
  heroFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 48,
    backgroundColor: colors.sidebar,
    opacity: 0.55,
  },
  copy: {
    alignItems: 'center',
    backgroundColor: colors.sidebar,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  copyCompact: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
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
    fontSize: typography.size2xl,
    fontWeight: typography.weightSemibold,
    letterSpacing: -0.5,
    lineHeight: typography.size2xl * 1.12,
    textAlign: 'center',
  },
  nameCompact: {
    fontSize: typography.sizeXl,
    lineHeight: typography.sizeXl * 1.12,
  },
  body: {
    marginTop: spacing.md,
    maxWidth: 300,
    color: colors.inkSoft,
    fontFamily: typography.fontBody,
    fontSize: typography.sizeMd,
    fontWeight: typography.weightRegular,
    lineHeight: typography.sizeMd * 1.6,
    textAlign: 'center',
  },
  signOffWrap: {
    marginTop: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  signOffLabel: {
    color: colors.muted,
    fontSize: typography.sizeXs,
    fontWeight: typography.weightMedium,
    letterSpacing: 0.6,
  },
  signOffName: {
    color: colors.ink,
    fontSize: typography.sizeSm,
    fontWeight: typography.weightSemibold,
  },
});
