import { Image, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, frameArt, radius, shadow, spacing, typography } from '../../../../../shared/theme/tokens';
import { fontHand, fontMono } from '../../../../../shared/theme/artFonts';
import { Text } from '../../../../../shared/ui/Text';
import type { LayoutProps } from '../TemplateRenderer';
import { useCardReveal } from '../useCardReveal';
import { CollageLetterBand } from './CollageLetterBand';
import { RevealBlock } from './RevealBlock';

const FRAME_NUMBERS = ['1A', '2', '2A', '3', '3A'] as const;
const SPROCKET_COUNT = 11;
const SPROCKET_WIDTH = 8;
const SPROCKET_HEIGHT = 6;
const EDGE_GUTTER = 14;
const CELL_RATIO = 1.2;

/** A loose, slightly overshooting loop — a grease-pencil circle, not a perfect ellipse. */
const PENCIL_LOOP =
  'M6 40 C4 14 38 4 70 7 C98 11 99 58 68 71 C38 82 5 70 8 38 C9 26 18 18 30 16';

function Sprockets() {
  return (
    <View style={styles.sprockets} pointerEvents="none">
      {Array.from({ length: SPROCKET_COUNT }, (_, i) => (
        <View key={i} style={styles.sprocket} />
      ))}
    </View>
  );
}

function Frame({ label, uri, circled }: { label: string; uri?: string; circled?: boolean }) {
  return (
    <View style={styles.frame}>
      <Text style={styles.frameNumber}>{label}</Text>
      <View style={styles.cell}>
        {uri ? (
          <Image source={{ uri }} style={styles.photo} resizeMode="cover" />
        ) : (
          <View style={styles.photoFallback} />
        )}
      </View>
      {circled ? (
        <View style={styles.pencil} pointerEvents="none">
          <Svg width="100%" height="100%" viewBox="0 0 100 80" preserveAspectRatio="none">
            <Path
              d={PENCIL_LOOP}
              fill="none"
              stroke={frameArt.pencil}
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </View>
      ) : null}
    </View>
  );
}

/**
 * Contact sheet — five frames off the roll and the one circled in red pencil.
 * The sixth frame carries the occasion.
 */
export function ContactSheet({
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
        <View style={styles.sheet}>
          <Text style={styles.edgePrint} numberOfLines={1}>
            OCCASIO 400  ▸  5  ▸  5A  ▸  6
          </Text>
          <View style={styles.body}>
            <Sprockets />
            <View style={styles.grid}>
              <View style={styles.row}>
                <Frame label={FRAME_NUMBERS[0]} uri={photoUris[0]} circled />
                <Frame label={FRAME_NUMBERS[1]} uri={photoUris[1]} />
              </View>
              <View style={styles.row}>
                <Frame label={FRAME_NUMBERS[2]} uri={photoUris[2]} />
                <Frame label={FRAME_NUMBERS[3]} uri={photoUris[3]} />
              </View>
              <View style={styles.row}>
                <Frame label={FRAME_NUMBERS[4]} uri={photoUris[4]} />
                <View style={styles.frame}>
                  <Text style={styles.frameNumber}>4</Text>
                  <View style={[styles.cell, styles.noteCell]}>
                    <Text style={styles.noteText} numberOfLines={3}>
                      {headline || displayName}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
            <Sprockets />
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
  sheet: {
    backgroundColor: frameArt.film,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  edgePrint: {
    paddingHorizontal: EDGE_GUTTER + spacing.xs,
    paddingBottom: spacing.xs,
    color: frameArt.filmEdge,
    fontFamily: fontMono,
    fontSize: typography.sizeXs,
    letterSpacing: 1,
  },
  body: {
    flexDirection: 'row',
  },
  sprockets: {
    width: EDGE_GUTTER,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  sprocket: {
    width: SPROCKET_WIDTH,
    height: SPROCKET_HEIGHT,
    borderRadius: 2,
    backgroundColor: frameArt.filmHole,
  },
  grid: {
    flex: 1,
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  frame: {
    flex: 1,
  },
  frameNumber: {
    color: frameArt.filmEdge,
    fontFamily: fontMono,
    fontSize: typography.sizeXs,
    lineHeight: typography.sizeXs * 1.3,
  },
  cell: {
    aspectRatio: CELL_RATIO,
    overflow: 'hidden',
    backgroundColor: colors.inkSoft,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoFallback: {
    flex: 1,
    backgroundColor: colors.inkSoft,
  },
  noteCell: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: frameArt.filmEdge,
    backgroundColor: 'transparent',
  },
  noteText: {
    color: frameArt.filmEdge,
    fontFamily: fontHand,
    fontSize: typography.sizeLg,
    lineHeight: typography.sizeLg * 1.1,
    textAlign: 'center',
  },
  pencil: {
    position: 'absolute',
    top: -spacing.xs,
    left: -spacing.sm,
    right: -spacing.sm,
    bottom: -spacing.sm,
    transform: [{ rotate: '-3deg' }],
  },
});
