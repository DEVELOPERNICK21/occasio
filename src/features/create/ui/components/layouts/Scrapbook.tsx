import { Image, StyleSheet, View, type ViewStyle } from 'react-native';
import { colors, radius, shadow, spacing } from '../../../../../shared/theme/tokens';
import type { LayoutProps } from '../TemplateRenderer';
import { useCardReveal } from '../useCardReveal';
import { CollageLetterBand } from './CollageLetterBand';
import { RevealBlock } from './RevealBlock';

type Print = { frame: ViewStyle; tape: ViewStyle; tapeColor: string };

const PRINTS: Print[] = [
  {
    frame: { top: '6%', left: '5%', width: '50%', transform: [{ rotate: '-6deg' }] },
    tape: { left: '30%', transform: [{ rotate: '-8deg' }] },
    tapeColor: colors.butter,
  },
  {
    frame: { top: '12%', right: '5%', width: '44%', transform: [{ rotate: '5deg' }] },
    tape: { left: '28%', transform: [{ rotate: '6deg' }] },
    tapeColor: colors.rose,
  },
  {
    frame: { bottom: '5%', left: '22%', width: '54%', transform: [{ rotate: '-2deg' }] },
    tape: { left: '34%', transform: [{ rotate: '3deg' }] },
    tapeColor: colors.sage,
  },
];

/**
 * Scrapbook — three taped prints scattered on paper.
 */
export function Scrapbook({
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
        <View style={styles.paper}>
          <View style={[styles.rule, { top: '30%' }]} />
          <View style={[styles.rule, { top: '62%' }]} />
          {PRINTS.map((print, i) => (
            <View key={i} style={[styles.print, print.frame]}>
              <View style={styles.photoBox}>
                {photoUris[i] ? (
                  <Image source={{ uri: photoUris[i] }} style={styles.photo} resizeMode="cover" />
                ) : (
                  <View style={styles.photoFallback} />
                )}
              </View>
              <View
                style={[styles.tape, print.tape, { backgroundColor: print.tapeColor }]}
              />
            </View>
          ))}
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
  paper: {
    aspectRatio: 4 / 5,
    backgroundColor: colors.butterSoft,
  },
  rule: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  print: {
    position: 'absolute',
    padding: 6,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 2,
    ...shadow.card,
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 5,
  },
  photoBox: {
    aspectRatio: 1,
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
  tape: {
    position: 'absolute',
    top: -8,
    width: '38%',
    height: 16,
    opacity: 0.72,
    borderRadius: 1,
  },
});
