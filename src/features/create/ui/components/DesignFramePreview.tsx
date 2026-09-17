import { Image, StyleSheet, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../../../shared/theme/tokens';
import { Text } from '../../../../shared/ui/Text';
import type { LayoutId } from '../../domain/templateSchema';

type Tone = {
  wash: string;
  photo: string;
  photoAlt: string;
  accent: string;
  ink: string;
};

type Props = {
  layoutId: LayoutId;
  title: string;
  tone: Tone;
  /** The photos already picked — the tile previews the real card, not a mock. */
  photoUris?: string[];
};

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

/** Mini editorial mock — silhouette only, no live TemplateRenderer overflow. */
export function DesignFramePreview({
  layoutId,
  title,
  tone,
  photoUris = [],
}: Props) {
  if (layoutId === 'minimal_fullscreen') {
    return (
      <View style={[styles.stage, { backgroundColor: tone.wash }]}>
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
      <View style={[styles.stage, { backgroundColor: tone.wash }]}>
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

  // editorial_portrait — photo above, warm letter band below
  return (
    <View style={[styles.stage, { backgroundColor: tone.wash }]}>
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
});
