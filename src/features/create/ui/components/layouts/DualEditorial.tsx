import { Image, StyleSheet, View } from 'react-native';
import { colors, radius, shadow, spacing, typography } from '../../../../../shared/theme/tokens';
import { Text } from '../../../../../shared/ui/Text';
import type { LayoutProps } from '../TemplateRenderer';
import { useCardReveal } from '../useCardReveal';
import { CardDivider } from './CardDivider';
import { RevealBlock } from './RevealBlock';

/** Two memories — side-by-side photos with a warm letter below. */
export function DualEditorial({
  photoUris,
  recipientName,
  headline,
  body,
  fromName,
  compact = false,
  replayKey = 0,
  animate = true,
}: LayoutProps) {
  const primaryPhoto = photoUris[0];
  const secondaryPhoto = photoUris[1];
  const displayName = recipientName.trim() || 'Their name';
  const signOff = fromName?.trim();
  const reveal = useCardReveal(replayKey, animate && !compact);

  return (
    <View style={[styles.card, compact && styles.cardCompact, shadow.card]}>
      <RevealBlock animatedStyle={reveal.photoStyle}>
        <View style={styles.photos}>
          <View style={styles.primarySlot}>
            {primaryPhoto ? (
              <Image source={{ uri: primaryPhoto }} style={styles.photo} resizeMode="cover" />
            ) : (
              <View style={styles.primaryFallback} />
            )}
          </View>
          <View style={styles.secondarySlot}>
            {secondaryPhoto ? (
              <Image source={{ uri: secondaryPhoto }} style={styles.photo} resizeMode="cover" />
            ) : (
              <View style={styles.secondaryFallback} />
            )}
          </View>
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
          {signOff ? <Text style={styles.signOff}>With love, {signOff}</Text> : null}
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
  photos: {
    flexDirection: 'row',
    aspectRatio: 5 / 4,
    gap: spacing.xs,
    padding: spacing.sm,
    backgroundColor: colors.sidebar,
  },
  primarySlot: {
    flex: 2,
    overflow: 'hidden',
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
  },
  secondarySlot: {
    flex: 1,
    alignSelf: 'flex-end',
    height: '72%',
    overflow: 'hidden',
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  primaryFallback: {
    flex: 1,
    backgroundColor: colors.accentSoft,
  },
  secondaryFallback: {
    flex: 1,
    backgroundColor: colors.border,
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
    lineHeight: typography.sizeMd * 1.6,
    textAlign: 'center',
  },
  signOff: {
    marginTop: spacing.lg,
    color: colors.ink,
    fontSize: typography.sizeSm,
    fontWeight: typography.weightSemibold,
    textAlign: 'center',
  },
});
