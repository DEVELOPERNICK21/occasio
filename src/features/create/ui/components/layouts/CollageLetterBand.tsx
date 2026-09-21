import { StyleSheet, View } from 'react-native';
import { colors, spacing, typography } from '../../../../../shared/theme/tokens';
import { Text } from '../../../../../shared/ui/Text';
import type { useCardReveal } from '../useCardReveal';
import { CardDivider } from './CardDivider';
import { RevealBlock } from './RevealBlock';

type Reveal = ReturnType<typeof useCardReveal>;

type Props = {
  headline: string;
  displayName: string;
  body: string;
  signOff?: string;
  compact?: boolean;
  reveal: Reveal;
};

/** Shared letter band under collage photo grids. */
export function CollageLetterBand({
  headline,
  displayName,
  body,
  signOff,
  compact = false,
  reveal,
}: Props) {
  return (
    <View style={[styles.copy, compact && styles.copyCompact]}>
      <RevealBlock animatedStyle={reveal.occasionStyle} style={styles.center}>
        {headline ? <Text style={styles.headline}>{headline}</Text> : null}
        <CardDivider />
      </RevealBlock>
      <RevealBlock animatedStyle={reveal.nameStyle} style={styles.center}>
        <Text style={[styles.name, compact && styles.nameCompact]}>{displayName}</Text>
      </RevealBlock>
      <RevealBlock animatedStyle={reveal.messageStyle} style={styles.center}>
        {body ? <Text style={styles.body}>{body}</Text> : null}
        {signOff ? <Text style={styles.signOff}>With love, {signOff}</Text> : null}
      </RevealBlock>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    width: '100%',
  },
  copy: {
    alignItems: 'center',
    backgroundColor: colors.sidebar,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  copyCompact: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  headline: {
    color: colors.accent,
    fontFamily: typography.fontBody,
    fontSize: typography.sizeXs,
    fontWeight: typography.weightMedium,
    letterSpacing: 1.2,
    lineHeight: typography.sizeXs * 1.4,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  name: {
    color: colors.ink,
    fontFamily: typography.fontDisplay,
    fontSize: typography.size2xl,
    fontWeight: typography.weightSemibold,
    letterSpacing: -0.5,
    lineHeight: typography.size2xl * 1.12,
    textAlign: 'center',
  },
  nameCompact: {
    fontSize: typography.sizeXl,
    lineHeight: typography.sizeXl * 1.12,
  },
  body: {
    marginTop: spacing.md,
    maxWidth: 300,
    color: colors.inkSoft,
    fontFamily: typography.fontBody,
    fontSize: typography.sizeMd,
    lineHeight: typography.sizeMd * 1.6,
    textAlign: 'center',
  },
  signOff: {
    marginTop: spacing.lg,
    color: colors.ink,
    fontSize: typography.sizeSm,
    fontWeight: typography.weightSemibold,
    textAlign: 'center',
  },
});
