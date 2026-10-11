import { Image, StyleSheet, View } from 'react-native';
import { Heart } from 'lucide-react-native';
import { colors, frameArt, radius, shadow, spacing, typography } from '../../../../../shared/theme/tokens';
import { fontHand } from '../../../../../shared/theme/artFonts';
import { Text } from '../../../../../shared/ui/Text';
import type { LayoutProps } from '../TemplateRenderer';
import { useCardReveal } from '../useCardReveal';
import { RevealBlock } from './RevealBlock';

const STAMP_WIDTH = 52;
const STAMP_HEIGHT = 62;
const POSTMARK = 58;
const GREETING_SIZE = 30;
const POSTMARK_TEXT_SIZE = 9;
const MESSAGE_SIZE = 19;
const MESSAGE_LINE = 27;

/**
 * Postcard — the picture on the front, the message and a stamp on the back.
 * Their name goes on the address line.
 */
export function Postcard({
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
      <RevealBlock animatedStyle={reveal.photoStyle}>
        <View style={styles.front}>
          {photoUris[0] ? (
            <Image source={{ uri: photoUris[0] }} style={styles.photo} resizeMode="cover" />
          ) : (
            <View style={styles.photoFallback} />
          )}
          {headline ? (
            <View style={styles.greetingWrap} pointerEvents="none">
              <Text style={styles.greeting} numberOfLines={1}>
                {headline}
              </Text>
            </View>
          ) : null}
        </View>
      </RevealBlock>

      <View style={styles.perforation} />

      <View style={styles.back}>
        <RevealBlock animatedStyle={reveal.messageStyle} style={styles.messageCol}>
          {body ? <Text style={styles.message}>{body}</Text> : null}
          {signOff ? <Text style={styles.signOff}>with love, {signOff}</Text> : null}
        </RevealBlock>

        <View style={styles.divider} />

        <RevealBlock animatedStyle={reveal.nameStyle} style={styles.addressCol}>
          {/* Stamp first, postmark second: the postmark inks over the stamp's edge. */}
          <View style={styles.stampRow}>
            <View style={styles.stamp}>
              <Heart size={22} color={frameArt.stampInk} fill={frameArt.stampInk} />
            </View>
            <View style={styles.postmark}>
              <Text style={styles.postmarkText}>OCCASIO</Text>
            </View>
          </View>
          <Text style={styles.address} numberOfLines={2}>
            {displayName}
          </Text>
          <View style={styles.addressRule} />
          <View style={styles.addressRule} />
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
    padding: spacing.md,
  },
  cardCompact: {
    maxWidth: 280,
  },
  front: {
    aspectRatio: 3 / 2,
    padding: spacing.xs + 2,
    backgroundColor: colors.white,
    transform: [{ rotate: '-1deg' }],
    ...shadow.card,
    shadowOpacity: 0.14,
    shadowRadius: 10,
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
  greetingWrap: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.md,
  },
  greeting: {
    color: colors.white,
    fontFamily: fontHand,
    fontSize: GREETING_SIZE,
    textShadowColor: 'rgba(0, 0, 0, 0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  perforation: {
    marginVertical: spacing.md,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
  },
  back: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  messageCol: {
    flex: 1.35,
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  message: {
    color: colors.ink,
    fontFamily: fontHand,
    fontSize: MESSAGE_SIZE,
    lineHeight: MESSAGE_LINE,
  },
  signOff: {
    color: colors.ink,
    fontFamily: fontHand,
    fontSize: MESSAGE_SIZE + 3,
    lineHeight: MESSAGE_LINE,
  },
  divider: {
    width: 1,
    backgroundColor: colors.border,
  },
  addressCol: {
    flex: 1,
    gap: spacing.sm,
  },
  stampRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  stamp: {
    width: STAMP_WIDTH,
    height: STAMP_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: frameArt.stampInk,
    backgroundColor: colors.roseSoft,
  },
  postmark: {
    width: POSTMARK,
    height: POSTMARK,
    marginRight: -spacing.lg,
    marginTop: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: frameArt.stampInk,
    opacity: 0.7,
    transform: [{ rotate: '-12deg' }],
  },
  postmarkText: {
    color: frameArt.stampInk,
    fontSize: POSTMARK_TEXT_SIZE,
    fontWeight: typography.weightSemibold,
    letterSpacing: 1.2,
  },
  address: {
    color: colors.ink,
    fontFamily: fontHand,
    fontSize: MESSAGE_SIZE + 3,
    lineHeight: MESSAGE_LINE,
  },
  addressRule: {
    height: 1,
    backgroundColor: colors.border,
    marginTop: spacing.md,
  },
});
