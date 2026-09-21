import { Image, StyleSheet, View } from 'react-native';
import { colors, radius, shadow, spacing } from '../../../../../shared/theme/tokens';
import type { LayoutProps } from '../TemplateRenderer';
import { useCardReveal } from '../useCardReveal';
import { CollageLetterBand } from './CollageLetterBand';
import { RevealBlock } from './RevealBlock';

function Slot({ uri, fallback }: { uri?: string; fallback: string }) {
  return (
    <View style={[styles.slot, { backgroundColor: fallback }]}>
      {uri ? (
        <Image source={{ uri }} style={styles.photo} resizeMode="cover" />
      ) : null}
    </View>
  );
}

/**
 * Side stories — tall column on the right, stacked photos on the left,
 * with a fourth strip along the bottom.
 */
export function AsymmetricSplit({
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
        <View style={styles.grid}>
          <View style={styles.topRow}>
            <View style={styles.leftCol}>
              <Slot uri={photoUris[0]} fallback={colors.accentSoft} />
              <Slot uri={photoUris[1]} fallback={colors.border} />
            </View>
            <View style={styles.rightCol}>
              <Slot uri={photoUris[2]} fallback={colors.accentSoft} />
            </View>
          </View>
          <View style={styles.footer}>
            <Slot uri={photoUris[3]} fallback={colors.border} />
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
  grid: {
    aspectRatio: 4 / 5,
    gap: spacing.xs,
    padding: spacing.sm,
    backgroundColor: colors.sidebar,
  },
  topRow: {
    flex: 3,
    flexDirection: 'row',
    gap: spacing.xs,
  },
  leftCol: {
    flex: 1,
    gap: spacing.xs,
  },
  rightCol: {
    flex: 1.15,
  },
  footer: {
    flex: 1,
  },
  slot: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: radius.md,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
});
