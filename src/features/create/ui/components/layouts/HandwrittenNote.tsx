import { Image, StyleSheet, View } from 'react-native';
import { colors, frameArt, radius, shadow, spacing } from '../../../../../shared/theme/tokens';
import { fontHand } from '../../../../../shared/theme/artFonts';
import { Text } from '../../../../../shared/ui/Text';
import type { LayoutProps } from '../TemplateRenderer';
import { useCardReveal } from '../useCardReveal';
import { RevealBlock } from './RevealBlock';

/** Every line of text is a whole multiple of this, so words sit on the ruled lines. */
const LINE = 30;
const RULE_COUNT = 18;
const MARGIN_LEFT = 44;
const PHOTO_WIDTH = 132;
const PHOTO_BLOCK_HEIGHT = LINE * 7;
const TAPE_WIDTH = 56;
const NAME_SIZE = 26;
const BODY_SIZE = 20;

/**
 * Handwritten note — a photo taped to ruled paper, and their message written
 * as if by hand. For the words that are hard to say out loud.
 */
export function HandwrittenNote({
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
      <View style={styles.page}>
        {Array.from({ length: RULE_COUNT }, (_, i) => (
          <View key={i} style={[styles.rule, { top: LINE * (i + 1) + LINE / 2 }]} />
        ))}
        <View style={styles.margin} />

        <View style={styles.header}>
          <RevealBlock animatedStyle={reveal.nameStyle} style={styles.greeting}>
            {headline ? (
              <Text style={styles.occasion} numberOfLines={1}>
                {headline}
              </Text>
            ) : null}
            <Text style={styles.name} numberOfLines={3}>
              Dear {displayName},
            </Text>
          </RevealBlock>

          <RevealBlock animatedStyle={reveal.photoStyle} style={styles.photoSlot}>
            <View style={styles.print}>
              {photoUris[0] ? (
                <Image source={{ uri: photoUris[0] }} style={styles.photo} resizeMode="cover" />
              ) : (
                <View style={styles.photoFallback} />
              )}
              <View style={styles.tape} />
            </View>
          </RevealBlock>
        </View>

        <RevealBlock animatedStyle={reveal.messageStyle}>
          {body ? <Text style={styles.body}>{body}</Text> : null}
          {signOff ? <Text style={styles.signOff}>with love, {signOff}</Text> : null}
        </RevealBlock>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    overflow: 'hidden',
    backgroundColor: frameArt.paper,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
  },
  cardCompact: {
    maxWidth: 280,
  },
  page: {
    paddingTop: LINE,
    paddingBottom: LINE,
    paddingLeft: MARGIN_LEFT,
    paddingRight: spacing.md,
  },
  rule: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: frameArt.paperRule,
  },
  margin: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: MARGIN_LEFT - spacing.sm,
    width: 1,
    backgroundColor: frameArt.paperMargin,
  },
  header: {
    height: PHOTO_BLOCK_HEIGHT,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  greeting: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  occasion: {
    color: colors.muted,
    fontFamily: fontHand,
    fontSize: BODY_SIZE,
    lineHeight: LINE,
  },
  name: {
    color: colors.ink,
    fontFamily: fontHand,
    fontSize: NAME_SIZE,
    lineHeight: LINE,
  },
  photoSlot: {
    width: PHOTO_WIDTH,
    transform: [{ rotate: '3deg' }],
  },
  print: {
    flex: 1,
    padding: spacing.xs + 2,
    paddingBottom: spacing.md,
    backgroundColor: colors.white,
    ...shadow.card,
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 4,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoFallback: {
    flex: 1,
    backgroundColor: colors.accentSoft,
  },
  tape: {
    position: 'absolute',
    top: -spacing.sm,
    alignSelf: 'center',
    width: TAPE_WIDTH,
    height: spacing.md,
    backgroundColor: colors.butter,
    opacity: 0.8,
    transform: [{ rotate: '-4deg' }],
  },
  body: {
    color: colors.ink,
    fontFamily: fontHand,
    fontSize: BODY_SIZE,
    lineHeight: LINE,
  },
  signOff: {
    marginTop: LINE,
    color: colors.ink,
    fontFamily: fontHand,
    fontSize: NAME_SIZE,
    lineHeight: LINE,
    textAlign: 'right',
  },
});
