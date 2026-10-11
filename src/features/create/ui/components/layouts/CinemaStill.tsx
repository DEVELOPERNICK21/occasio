import { Image, StyleSheet, View } from 'react-native';
import { colors, frameArt, radius, shadow, spacing, typography } from '../../../../../shared/theme/tokens';
import { Text } from '../../../../../shared/ui/Text';
import type { LayoutProps } from '../TemplateRenderer';
import { useCardReveal } from '../useCardReveal';
import { RevealBlock } from './RevealBlock';

const BRACKET = 16;
const BRACKET_INSET = 10;

function ViewfinderCorner({ corner }: { corner: 'tl' | 'tr' | 'bl' | 'br' }) {
  return (
    <View
      pointerEvents="none"
      style={[
        styles.bracket,
        corner === 'tl' && styles.bracketTl,
        corner === 'tr' && styles.bracketTr,
        corner === 'bl' && styles.bracketBl,
        corner === 'br' && styles.bracketBr,
      ]}
    />
  );
}

/**
 * Our movie — a title card, a widescreen still and end-credits. Their name is
 * the title; the sender is "directed by".
 */
export function CinemaStill({
  photoUris,
  recipientName,
  headline,
  body,
  fromName,
  compact = false,
  replayKey = 0,
  animate = true,
}: LayoutProps) {
  const displayName = recipientName.trim() || 'Their name';
  const signOff = fromName?.trim();
  const reveal = useCardReveal(replayKey, animate && !compact);

  return (
    <View style={[styles.card, compact && styles.cardCompact, shadow.card]}>
      <RevealBlock animatedStyle={reveal.occasionStyle} style={styles.title}>
        {headline ? (
          <View style={styles.taglineRow}>
            <View style={styles.taglineRule} />
            <Text style={styles.tagline}>{headline}</Text>
            <View style={styles.taglineRule} />
          </View>
        ) : null}
        <Text style={[styles.name, compact && styles.nameCompact]} numberOfLines={2}>
          {displayName}
        </Text>
      </RevealBlock>

      <RevealBlock animatedStyle={reveal.photoStyle}>
        <View style={styles.screen}>
          {photoUris[0] ? (
            <Image source={{ uri: photoUris[0] }} style={styles.photo} resizeMode="cover" />
          ) : (
            <View style={styles.photoFallback} />
          )}
          <ViewfinderCorner corner="tl" />
          <ViewfinderCorner corner="tr" />
          <ViewfinderCorner corner="bl" />
          <ViewfinderCorner corner="br" />
        </View>
      </RevealBlock>

      <RevealBlock animatedStyle={reveal.messageStyle} style={styles.credits}>
        {body ? <Text style={styles.body}>{body}</Text> : null}
        {signOff ? (
          <Text style={styles.directed}>
            Directed by <Text style={styles.directedName}>{signOff}</Text>
          </Text>
        ) : null}
      </RevealBlock>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    overflow: 'hidden',
    backgroundColor: frameArt.film,
    borderRadius: radius.xl,
  },
  cardCompact: {
    maxWidth: 280,
  },
  title: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  taglineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  taglineRule: {
    width: spacing.lg,
    height: StyleSheet.hairlineWidth,
    backgroundColor: frameArt.filmEdge,
  },
  tagline: {
    color: frameArt.filmEdge,
    fontSize: typography.sizeXs,
    fontWeight: typography.weightMedium,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  name: {
    color: colors.white,
    fontFamily: typography.fontDisplay,
    fontSize: typography.sizeXl,
    fontWeight: typography.weightSemibold,
    letterSpacing: 5,
    lineHeight: typography.sizeXl * 1.2,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  nameCompact: {
    fontSize: typography.sizeLg,
    letterSpacing: 3,
  },
  screen: {
    aspectRatio: 16 / 10,
    backgroundColor: frameArt.film,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoFallback: {
    flex: 1,
    backgroundColor: colors.inkSoft,
  },
  bracket: {
    position: 'absolute',
    width: BRACKET,
    height: BRACKET,
    borderColor: colors.white,
    opacity: 0.75,
  },
  bracketTl: {
    top: BRACKET_INSET,
    left: BRACKET_INSET,
    borderTopWidth: 2,
    borderLeftWidth: 2,
  },
  bracketTr: {
    top: BRACKET_INSET,
    right: BRACKET_INSET,
    borderTopWidth: 2,
    borderRightWidth: 2,
  },
  bracketBl: {
    bottom: BRACKET_INSET,
    left: BRACKET_INSET,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
  },
  bracketBr: {
    bottom: BRACKET_INSET,
    right: BRACKET_INSET,
    borderBottomWidth: 2,
    borderRightWidth: 2,
  },
  credits: {
    alignItems: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  body: {
    maxWidth: 300,
    color: colors.white,
    fontFamily: typography.fontBody,
    fontSize: typography.sizeMd,
    fontStyle: 'italic',
    lineHeight: typography.sizeMd * 1.6,
    textAlign: 'center',
  },
  directed: {
    color: frameArt.filmEdge,
    fontSize: typography.sizeXs,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  directedName: {
    color: colors.white,
    fontWeight: typography.weightSemibold,
  },
});
