import { Image, StyleSheet, View } from 'react-native';
import { colors, frameArt, radius, shadow, spacing, typography } from '../../../../../shared/theme/tokens';
import { fontHand } from '../../../../../shared/theme/artFonts';
import { Text } from '../../../../../shared/ui/Text';
import type { LayoutProps } from '../TemplateRenderer';
import { useCardReveal } from '../useCardReveal';
import { RevealBlock } from './RevealBlock';

/** Strip width ÷ height — four frames stacked, like a real booth strip. */
const STRIP_RATIO = 0.32;

function Shot({ uri }: { uri?: string }) {
  return (
    <View style={styles.shot}>
      {uri ? (
        <Image source={{ uri }} style={styles.photo} resizeMode="cover" />
      ) : (
        <View style={styles.photoFallback} />
      )}
      <View style={styles.sepia} pointerEvents="none" />
    </View>
  );
}

/**
 * Photo booth — three shots and a fourth frame for the occasion, on a booth
 * curtain, with their words beside it.
 */
export function PhotoBooth({
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
      <View style={styles.stage}>
        <RevealBlock animatedStyle={reveal.photoStyle} style={styles.stripWrap}>
          <View style={styles.strip}>
            <Shot uri={photoUris[0]} />
            <Shot uri={photoUris[1]} />
            <Shot uri={photoUris[2]} />
            <View style={styles.captionShot}>
              <Text style={styles.captionText} numberOfLines={3}>
                {headline || displayName}
              </Text>
            </View>
          </View>
        </RevealBlock>

        <View style={styles.copy}>
          <RevealBlock animatedStyle={reveal.occasionStyle}>
            {headline ? <Text style={styles.kicker}>{headline}</Text> : null}
          </RevealBlock>
          <RevealBlock animatedStyle={reveal.nameStyle}>
            <Text style={[styles.name, compact && styles.nameCompact]} numberOfLines={3}>
              {displayName}
            </Text>
            <View style={styles.rule} />
          </RevealBlock>
          <RevealBlock animatedStyle={reveal.messageStyle}>
            {body ? <Text style={styles.body}>{body}</Text> : null}
            {signOff ? <Text style={styles.signOff}>with love, {signOff}</Text> : null}
          </RevealBlock>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    overflow: 'hidden',
    backgroundColor: frameArt.boothCurtain,
    borderRadius: radius.xl,
  },
  cardCompact: {
    maxWidth: 280,
  },
  stage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    padding: spacing.lg,
  },
  stripWrap: {
    width: '36%',
    transform: [{ rotate: '-3deg' }],
  },
  strip: {
    aspectRatio: STRIP_RATIO,
    gap: spacing.xs + 2,
    padding: spacing.xs + 2,
    backgroundColor: colors.white,
    ...shadow.card,
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 6,
  },
  shot: {
    flex: 1,
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
  sepia: {
    ...StyleSheet.absoluteFill,
    backgroundColor: frameArt.sepia,
  },
  captionShot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
    backgroundColor: frameArt.paper,
  },
  captionText: {
    color: colors.ink,
    fontFamily: fontHand,
    fontSize: typography.sizeMd,
    lineHeight: typography.sizeMd * 1.2,
    textAlign: 'center',
  },
  copy: {
    flex: 1,
    gap: spacing.md,
  },
  kicker: {
    color: colors.accentSoft,
    fontSize: typography.sizeXs,
    fontWeight: typography.weightMedium,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  name: {
    color: colors.white,
    fontFamily: typography.fontDisplay,
    fontSize: typography.sizeXl,
    fontWeight: typography.weightSemibold,
    letterSpacing: -0.4,
    lineHeight: typography.sizeXl * 1.12,
  },
  nameCompact: {
    fontSize: typography.sizeLg,
  },
  rule: {
    width: spacing.xl,
    height: 2,
    marginTop: spacing.md,
    backgroundColor: colors.accentSoft,
  },
  body: {
    color: colors.white,
    fontFamily: typography.fontBody,
    fontSize: typography.sizeSm,
    lineHeight: typography.sizeSm * 1.6,
  },
  signOff: {
    marginTop: spacing.md,
    color: colors.accentSoft,
    fontFamily: fontHand,
    fontSize: typography.sizeLg,
  },
});
