import { Image, StyleSheet, View } from 'react-native';
import { colors, frameArt, radius, spacing, typography } from '../../../../shared/theme/tokens';
import { Text } from '../../../../shared/ui/Text';
import type { LayoutId } from '../../domain/templateSchema';

export type FrameTone = {
  wash: string;
  photo: string;
  photoAlt: string;
  accent: string;
  ink: string;
};

type Props = {
  layoutId: LayoutId;
  title: string;
  tone: FrameTone;
  /** The photos already picked — the tile previews the real card, not a mock. */
  photoUris?: string[];
  height?: number;
};

const SCRAP_PRINTS = [
  { top: '4%', left: '4%', width: '50%', transform: [{ rotate: '-6deg' }] },
  { top: '10%', right: '4%', width: '44%', transform: [{ rotate: '5deg' }] },
  { bottom: '2%', left: '24%', width: '50%', transform: [{ rotate: '-2deg' }] },
] as const;

const SCRAP_TAPE = [colors.butter, colors.rose, colors.sage] as const;

function PhotoFill({ uri, fallback }: { uri?: string; fallback: string }) {
  if (!uri) {
    return (
      <View style={[StyleSheet.absoluteFill, { backgroundColor: fallback }]}>
        <View style={styles.photoSheen} />
      </View>
    );
  }
  return <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />;
}

function MiniSlot({
  uri,
  fallback,
  style,
}: {
  uri?: string;
  fallback: string;
  style?: object;
}) {
  return (
    <View style={[styles.miniSlot, style]}>
      <PhotoFill uri={uri} fallback={fallback} />
    </View>
  );
}

/** Mini editorial mock — silhouette only, no live TemplateRenderer overflow. */
export function DesignFramePreview({
  layoutId,
  title,
  tone,
  photoUris = [],
  height,
}: Props) {
  const stageStyle = [styles.stage, height ? { height } : null];

  if (layoutId === 'minimal_fullscreen') {
    return (
      <View style={[stageStyle, { backgroundColor: tone.wash }]}>
        <View style={styles.fullBleed}>
          <PhotoFill uri={photoUris[0]} fallback={tone.photo} />
          <View style={styles.fullBleedShade} />
          <View style={styles.fullBleedCopy}>
            <Text style={[styles.miniLabel, { color: colors.white }]} numberOfLines={1}>
              {title}
            </Text>
            <View style={[styles.nameRule, { backgroundColor: colors.white }]} />
          </View>
        </View>
      </View>
    );
  }

  if (layoutId === 'dual_editorial') {
    return (
      <View style={[stageStyle, { backgroundColor: tone.wash }]}>
        <View style={styles.dualRow}>
          <View style={styles.dualPrimary}>
            <PhotoFill uri={photoUris[0]} fallback={tone.photo} />
          </View>
          <View style={styles.dualSide}>
            <View style={styles.dualSecondary}>
              <PhotoFill uri={photoUris[1]} fallback={tone.photoAlt} />
            </View>
            <View style={styles.dualCaption}>
              <Text style={[styles.miniLabelDark, { color: tone.ink }]} numberOfLines={1}>
                {title}
              </Text>
              <View style={[styles.accentDot, { backgroundColor: tone.accent }]} />
            </View>
          </View>
        </View>
      </View>
    );
  }

  if (layoutId === 'film_strip') {
    return (
      <View style={[stageStyle, { backgroundColor: tone.wash }]}>
        <View style={styles.stripCol}>
          <MiniSlot uri={photoUris[0]} fallback={tone.photo} />
          <MiniSlot uri={photoUris[1]} fallback={tone.photoAlt} />
          <MiniSlot uri={photoUris[2]} fallback={tone.photo} />
        </View>
      </View>
    );
  }

  if (layoutId === 'asymmetric_split') {
    return (
      <View style={[stageStyle, { backgroundColor: tone.wash }]}>
        <View style={styles.asymGrid}>
          <View style={styles.asymTop}>
            <View style={styles.asymLeft}>
              <MiniSlot uri={photoUris[0]} fallback={tone.photo} />
              <MiniSlot uri={photoUris[1]} fallback={tone.photoAlt} />
            </View>
            <MiniSlot uri={photoUris[2]} fallback={tone.photo} style={styles.asymTall} />
          </View>
          <MiniSlot uri={photoUris[3]} fallback={tone.photoAlt} style={styles.asymFooter} />
        </View>
      </View>
    );
  }

  if (layoutId === 'story_mosaic') {
    return (
      <View style={[stageStyle, { backgroundColor: tone.wash }]}>
        <View style={styles.mosaicGrid}>
          <MiniSlot uri={photoUris[0]} fallback={tone.photo} style={styles.mosaicBanner} />
          <View style={styles.mosaicRow}>
            <MiniSlot uri={photoUris[1]} fallback={tone.photoAlt} />
            <MiniSlot uri={photoUris[2]} fallback={tone.photo} />
          </View>
          <View style={styles.mosaicRow}>
            <MiniSlot uri={photoUris[3]} fallback={tone.photo} />
            <MiniSlot uri={photoUris[4]} fallback={tone.photoAlt} />
          </View>
        </View>
      </View>
    );
  }

  if (layoutId === 'polaroid_overlay') {
    return (
      <View style={[stageStyle, { backgroundColor: tone.wash }]}>
        <View style={styles.polaroidStage}>
          <View style={styles.polaroidBase}>
            <PhotoFill uri={photoUris[0]} fallback={tone.photo} />
          </View>
          <View style={styles.polaroidInset}>
            <PhotoFill uri={photoUris[1]} fallback={tone.photoAlt} />
          </View>
        </View>
      </View>
    );
  }

  if (layoutId === 'scrapbook') {
    return (
      <View style={[stageStyle, { backgroundColor: colors.butterSoft }]}>
        <View style={styles.scrapStage}>
          {SCRAP_PRINTS.map((print, i) => (
            <View key={i} style={[styles.scrapPrint, print]}>
              <View style={styles.scrapPhoto}>
                <PhotoFill uri={photoUris[i]} fallback={i % 2 ? tone.photoAlt : tone.photo} />
              </View>
              <View style={[styles.scrapTape, { backgroundColor: SCRAP_TAPE[i] }]} />
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (layoutId === 'poster_type') {
    return (
      <View style={[stageStyle, styles.posterStage, { backgroundColor: tone.accent }]}>
        <Text style={styles.posterWord} numberOfLines={1} adjustsFontSizeToFit>
          {title.toUpperCase()}
        </Text>
        <MiniSlot uri={photoUris[0]} fallback={tone.photo} />
        <View style={styles.posterRule} />
      </View>
    );
  }

  if (layoutId === 'big_words') {
    const words = title.toLowerCase().replace(/[,.!]/g, '').split(/\s+/).filter(Boolean).slice(0, 3);
    return (
      <View style={[stageStyle, { backgroundColor: tone.wash }]}>
        <View style={styles.quadGrid}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={styles.quadCell}>
              <PhotoFill uri={photoUris[i]} fallback={i % 3 ? tone.photoAlt : tone.photo} />
            </View>
          ))}
          <View style={styles.quadWords} pointerEvents="none">
            {words.map((word, i) => (
              <Text
                key={`${word}-${i}`}
                style={[styles.quadWord, { textAlign: i % 2 ? 'right' : 'left' }]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {word}
              </Text>
            ))}
          </View>
        </View>
      </View>
    );
  }

  if (layoutId === 'framed_blur') {
    return (
      <View style={[stageStyle, { backgroundColor: tone.wash }]}>
        <View style={styles.framedStage}>
          {photoUris[0] ? (
            <Image
              source={{ uri: photoUris[0] }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
              blurRadius={10}
            />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: tone.photoAlt }]} />
          )}
          <View style={styles.framedMount}>
            <View style={styles.framedPhoto}>
              <PhotoFill uri={photoUris[0]} fallback={tone.photo} />
            </View>
          </View>
        </View>
      </View>
    );
  }

  if (layoutId === 'cinema_still') {
    return (
      <View style={[stageStyle, { backgroundColor: frameArt.film }]}>
        <View style={styles.cineStack}>
          <Text style={styles.cineTag} numberOfLines={1}>
            {title}
          </Text>
          <View style={styles.cineName} />
          <View style={styles.cineScreen}>
            <PhotoFill uri={photoUris[0]} fallback={colors.inkSoft} />
          </View>
          <View style={styles.cineCredit} />
        </View>
      </View>
    );
  }

  if (layoutId === 'handwritten_note') {
    return (
      <View style={[stageStyle, { backgroundColor: frameArt.paper }]}>
        <View style={styles.noteStage}>
          {[0, 1, 2, 3, 4].map((i) => (
            <View key={i} style={[styles.noteRule, { top: `${18 + i * 18}%` }]} />
          ))}
          <View style={styles.noteMargin} />
          <View style={styles.noteCopy}>
            <View style={[styles.noteInk, styles.noteInkLong]} />
            <View style={styles.noteInk} />
            <View style={styles.noteInk} />
          </View>
          <View style={styles.notePhoto}>
            <PhotoFill uri={photoUris[0]} fallback={tone.photo} />
            <View style={styles.noteTape} />
          </View>
        </View>
      </View>
    );
  }

  if (layoutId === 'postcard') {
    return (
      <View style={[stageStyle, { backgroundColor: frameArt.paper }]}>
        <View style={styles.cardStack}>
          <View style={styles.cardFront}>
            <PhotoFill uri={photoUris[0]} fallback={tone.photo} />
          </View>
          <View style={styles.cardBack}>
            <View style={styles.cardLines}>
              <View style={styles.noteInk} />
              <View style={styles.noteInk} />
            </View>
            <View style={styles.cardStamp} />
          </View>
        </View>
      </View>
    );
  }

  if (layoutId === 'photo_booth') {
    return (
      <View style={[stageStyle, { backgroundColor: frameArt.boothCurtain }]}>
        <View style={styles.boothRow}>
          <View style={styles.boothStrip}>
            {[0, 1, 2].map((i) => (
              <View key={i} style={styles.boothShot}>
                <PhotoFill uri={photoUris[i]} fallback={tone.photoAlt} />
              </View>
            ))}
            <View style={[styles.boothShot, styles.boothCaption]} />
          </View>
          <View style={styles.boothCopy}>
            <View style={styles.boothBarSmall} />
            <View style={styles.boothBarLarge} />
            <View style={styles.boothBar} />
            <View style={styles.boothBar} />
          </View>
        </View>
      </View>
    );
  }

  if (layoutId === 'contact_sheet') {
    return (
      <View style={[stageStyle, { backgroundColor: frameArt.film }]}>
        <View style={styles.sheetRow}>
          <View style={styles.sheetHoles}>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <View key={i} style={styles.sheetHole} />
            ))}
          </View>
          <View style={styles.sheetGrid}>
            {[0, 1, 2].map((row) => (
              <View key={row} style={styles.sheetGridRow}>
                <View style={styles.sheetCell}>
                  <PhotoFill uri={photoUris[row * 2]} fallback={colors.inkSoft} />
                  {row === 0 ? <View style={styles.sheetPencil} /> : null}
                </View>
                {row === 2 ? (
                  <View style={[styles.sheetCell, styles.sheetNote]} />
                ) : (
                  <View style={styles.sheetCell}>
                    <PhotoFill uri={photoUris[row * 2 + 1]} fallback={colors.inkSoft} />
                  </View>
                )}
              </View>
            ))}
          </View>
          <View style={styles.sheetHoles}>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <View key={i} style={styles.sheetHole} />
            ))}
          </View>
        </View>
      </View>
    );
  }

  // editorial_portrait — photo above, warm letter band below
  return (
    <View style={[stageStyle, { backgroundColor: tone.wash }]}>
      <View style={styles.portraitStack}>
        <View style={styles.portraitPhoto}>
          <PhotoFill uri={photoUris[0]} fallback={tone.photo} />
          <View style={[styles.polaroidEdge, { borderColor: colors.white }]} />
        </View>
        <View style={[styles.letterBand, { backgroundColor: colors.surface }]}>
          <Text style={[styles.letterHeadline, { color: tone.accent }]} numberOfLines={1}>
            {title}
          </Text>
          <View style={[styles.letterLines, { backgroundColor: tone.wash }]} />
          <View
            style={[
              styles.letterLines,
              styles.letterLinesShort,
              { backgroundColor: tone.wash },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    width: '100%',
    height: 168,
    padding: spacing.sm,
    justifyContent: 'center',
  },
  fullBleed: {
    flex: 1,
    borderRadius: radius.md,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  fullBleedShade: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.ink,
    opacity: 0.22,
  },
  fullBleedCopy: {
    zIndex: 1,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  miniLabel: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightSemibold,
  },
  miniLabelDark: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightSemibold,
    flex: 1,
  },
  nameRule: {
    width: 36,
    height: 2,
    borderRadius: 1,
    opacity: 0.85,
  },
  dualRow: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.xs,
  },
  dualPrimary: {
    flex: 1.35,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  dualSide: {
    flex: 1,
    gap: spacing.xs,
  },
  dualSecondary: {
    flex: 1.2,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  dualCaption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: 2,
  },
  accentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  portraitStack: {
    flex: 1,
    gap: spacing.xs,
  },
  portraitPhoto: {
    flex: 1.45,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  polaroidEdge: {
    ...StyleSheet.absoluteFill,
    borderWidth: 2,
    borderRadius: radius.sm,
    opacity: 0.55,
  },
  letterBand: {
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    gap: 5,
    borderWidth: 1,
    borderColor: colors.border,
  },
  letterHeadline: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightSemibold,
  },
  letterLines: {
    height: 3,
    borderRadius: 2,
    width: '88%',
    opacity: 0.9,
  },
  letterLinesShort: {
    width: '58%',
  },
  photoSheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: '35%',
    bottom: '40%',
    backgroundColor: colors.white,
    opacity: 0.14,
  },
  miniSlot: {
    flex: 1,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  stripCol: {
    flex: 1,
    gap: 3,
  },
  asymGrid: {
    flex: 1,
    gap: 3,
  },
  asymTop: {
    flex: 3,
    flexDirection: 'row',
    gap: 3,
  },
  asymLeft: {
    flex: 1,
    gap: 3,
  },
  asymTall: {
    flex: 1.15,
  },
  asymFooter: {
    flex: 1,
  },
  mosaicGrid: {
    flex: 1,
    gap: 3,
  },
  mosaicBanner: {
    flex: 1.15,
  },
  mosaicRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 3,
  },
  scrapStage: {
    flex: 1,
  },
  scrapPrint: {
    position: 'absolute',
    padding: 3,
    paddingBottom: 8,
    backgroundColor: colors.surface,
    borderRadius: 1,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 4,
    elevation: 3,
  },
  scrapPhoto: {
    aspectRatio: 1,
    overflow: 'hidden',
  },
  scrapTape: {
    position: 'absolute',
    top: -4,
    left: '32%',
    width: '36%',
    height: 8,
    opacity: 0.75,
  },
  posterStage: {
    gap: 4,
  },
  posterWord: {
    color: colors.white,
    fontSize: typography.sizeLg,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  posterRule: {
    height: 8,
    width: '70%',
    borderRadius: 2,
    backgroundColor: colors.white,
    opacity: 0.9,
  },
  quadGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  quadCell: {
    width: '49%',
    height: '49%',
    flexGrow: 1,
    overflow: 'hidden',
  },
  quadWords: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'space-evenly',
    paddingHorizontal: 6,
  },
  quadWord: {
    color: colors.butter,
    fontSize: typography.sizeXl,
    fontWeight: '800',
    letterSpacing: -1,
    textShadowColor: 'rgba(42, 34, 32, 0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  framedStage: {
    flex: 1,
    borderRadius: radius.sm,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  framedMount: {
    width: '58%',
    padding: 4,
    backgroundColor: colors.surface,
    borderRadius: 2,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  framedPhoto: {
    aspectRatio: 4 / 5,
    overflow: 'hidden',
  },
  polaroidStage: {
    flex: 1,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  polaroidBase: {
    ...StyleSheet.absoluteFill,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  polaroidInset: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: '34%',
    aspectRatio: 3 / 4,
    borderRadius: 3,
    borderWidth: 2,
    borderColor: colors.surface,
    overflow: 'hidden',
    transform: [{ rotate: '5deg' }],
  },

  cineStack: {
    flex: 1,
    gap: spacing.xs,
  },
  cineTag: {
    color: frameArt.filmEdge,
    fontSize: typography.sizeXs,
    letterSpacing: 1.4,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  cineName: {
    alignSelf: 'center',
    width: '46%',
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.white,
  },
  cineScreen: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: 2,
  },
  cineCredit: {
    alignSelf: 'center',
    width: '34%',
    height: 3,
    borderRadius: 2,
    backgroundColor: frameArt.filmEdge,
  },
  noteStage: {
    flex: 1,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  noteRule: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: frameArt.paperRule,
  },
  noteMargin: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '14%',
    width: 1,
    backgroundColor: frameArt.paperMargin,
  },
  noteCopy: {
    position: 'absolute',
    top: '12%',
    left: '20%',
    width: '34%',
    gap: spacing.sm,
  },
  noteInk: {
    height: 3,
    width: '90%',
    borderRadius: 2,
    backgroundColor: colors.inkSoft,
    opacity: 0.55,
  },
  noteInkLong: {
    width: '100%',
    height: 4,
    opacity: 0.8,
  },
  notePhoto: {
    position: 'absolute',
    top: '10%',
    right: '8%',
    width: '34%',
    height: '62%',
    padding: 3,
    backgroundColor: colors.white,
    transform: [{ rotate: '3deg' }],
  },
  noteTape: {
    position: 'absolute',
    top: -4,
    alignSelf: 'center',
    width: '50%',
    height: 8,
    backgroundColor: colors.butter,
    opacity: 0.85,
  },
  cardStack: {
    flex: 1,
    gap: spacing.xs,
  },
  cardFront: {
    flex: 1.4,
    padding: 3,
    backgroundColor: colors.white,
    overflow: 'hidden',
    transform: [{ rotate: '-1deg' }],
  },
  cardBack: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  cardLines: {
    flex: 1,
    gap: spacing.xs,
  },
  cardStamp: {
    width: 22,
    height: 26,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: frameArt.stampInk,
    backgroundColor: colors.roseSoft,
  },
  boothRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  boothStrip: {
    width: '34%',
    height: '100%',
    gap: 3,
    padding: 3,
    backgroundColor: colors.white,
    transform: [{ rotate: '-3deg' }],
  },
  boothShot: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: colors.border,
  },
  boothCaption: {
    backgroundColor: frameArt.paper,
  },
  boothCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  boothBarSmall: {
    width: '40%',
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.accentSoft,
  },
  boothBarLarge: {
    width: '80%',
    height: 6,
    borderRadius: 2,
    backgroundColor: colors.white,
  },
  boothBar: {
    width: '95%',
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.white,
    opacity: 0.6,
  },
  sheetRow: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.xs,
  },
  sheetHoles: {
    width: 6,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  sheetHole: {
    width: 5,
    height: 4,
    borderRadius: 1,
    backgroundColor: frameArt.filmHole,
  },
  sheetGrid: {
    flex: 1,
    gap: 3,
  },
  sheetGridRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 3,
  },
  sheetCell: {
    flex: 1,
    overflow: 'visible',
    backgroundColor: colors.inkSoft,
  },
  sheetNote: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: frameArt.filmEdge,
    backgroundColor: 'transparent',
  },
  sheetPencil: {
    position: 'absolute',
    top: -3,
    left: -4,
    right: -4,
    bottom: -3,
    borderWidth: 1.5,
    borderColor: frameArt.pencil,
    borderRadius: radius.full,
    transform: [{ rotate: '-4deg' }],
  },
});
