import { StyleSheet, View } from 'react-native';
import { Text } from '../../../../shared/ui/Text';
import { CardWashBackground } from '../../../../shared/ui/CardWashBackground';
import { colors, radius, shadow, spacing, typography } from '../../../../shared/theme/tokens';

type Props = {
  eyebrow: string;
  headline: string;
  headlineHighlight?: string;
  body: string;
};

function MilestoneHeadline({ headline, highlight }: { headline: string; highlight?: string }) {
  if (!highlight || !headline.includes(highlight)) {
    return <Text style={styles.headline}>{headline}</Text>;
  }

  const [before, after] = headline.split(highlight);
  return (
    <Text style={styles.headline}>
      {before}
      <Text style={styles.headlineHighlight}>{highlight}</Text>
      {after}
    </Text>
  );
}

/** Progress card — real counts only; no upgrade pressure or inflated metrics. */
export function MilestoneCard({ eyebrow, headline, headlineHighlight, body }: Props) {
  return (
    <View style={styles.card}>
      <CardWashBackground
        variant="milestone"
        primary={colors.accentSoft}
        secondary={colors.secondary}
      />
      <View style={styles.copy}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <MilestoneHeadline headline={headline} highlight={headlineHighlight} />
        <Text style={styles.body}>{body}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadow.card,
    shadowOpacity: 0.06,
  },
  copy: {
    zIndex: 1,
    padding: spacing.md,
    gap: spacing.xs,
  },
  eyebrow: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightSemibold,
    color: colors.accent,
  },
  headline: {
    fontSize: typography.sizeMd,
    lineHeight: typography.sizeMd * 1.35,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
    letterSpacing: -0.2,
  },
  headlineHighlight: {
    color: colors.accent,
    fontWeight: typography.weightSemibold,
  },
  body: {
    fontSize: typography.sizeSm,
    lineHeight: typography.sizeSm * 1.45,
    color: colors.inkSoft,
  },
});
