import { Image, StyleSheet, View } from 'react-native';
import { colors, radius, shadow, typography } from '../../../../../shared/theme/tokens';
import { Text } from '../../../../../shared/ui/Text';
import type { LayoutProps } from '../TemplateRenderer';
import { useCardReveal } from '../useCardReveal';
import { CollageLetterBand } from './CollageLetterBand';
import { RevealBlock } from './RevealBlock';

const MAX_LINES = 4;

function headlineLines(headline: string): string[] {
  const words = headline.toLowerCase().replace(/[,.!]/g, '').split(/\s+/).filter(Boolean);
  if (words.length <= MAX_LINES) return words;
  return [...words.slice(0, MAX_LINES - 1), words.slice(MAX_LINES - 1).join(' ')];
}

/**
 * Big words — four photos in a grid with the headline set huge across them.
 */
export function BigWords({
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
  const lines = headlineLines(headline);
  const wordSize = compact ? 34 : 56;

  return (
    <View style={[styles.card, compact && styles.cardCompact, shadow.card]}>
      <RevealBlock animatedStyle={reveal.photoStyle}>
        <View style={styles.stage}>
          <View style={styles.grid}>
            {[0, 1, 2, 3].map((i) => (
              <View key={i} style={styles.cell}>
                {photoUris[i] ? (
                  <Image source={{ uri: photoUris[i] }} style={styles.photo} resizeMode="cover" />
                ) : (
                  <View style={styles.photoFallback} />
                )}
              </View>
            ))}
          </View>
          <View style={styles.words} pointerEvents="none">
            {lines.map((word, i) => (
              <Text
                key={`${word}-${i}`}
                style={[
                  styles.word,
                  {
                    fontSize: wordSize,
                    lineHeight: wordSize * 0.95,
                    textAlign: i % 2 === 0 ? 'left' : 'right',
                  },
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {word}
              </Text>
            ))}
          </View>
        </View>
      </RevealBlock>
      <CollageLetterBand
        headline=""
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
  stage: {
    aspectRatio: 4 / 5,
    backgroundColor: colors.surface,
  },
  grid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
  },
  cell: {
    width: '49.5%',
    height: '49.5%',
    flexGrow: 1,
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
  words: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'space-evenly',
    paddingHorizontal: 12,
  },
  word: {
    color: colors.butter,
    fontFamily: typography.fontDisplay,
    fontWeight: '800',
    letterSpacing: -1.5,
    textShadowColor: 'rgba(42, 34, 32, 0.45)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
});
