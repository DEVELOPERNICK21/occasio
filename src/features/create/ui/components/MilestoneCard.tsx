import { Sparkles } from 'lucide-react-native';
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
    <View style={styles.shadowShell}>
      <View style={styles.card}>
        <CardWashBackground
          variant="milestone"
          primary={colors.accentSoft}
          secondary={colors.secondary}
        />
        <View style={styles.copy}>
          <View style={styles.eyebrowRow}>
            <View style={styles.iconWrap}>
              <Sparkles
                size={14}
                color={colors.accent}
                strokeWidth={2}
                absoluteStrokeWidth
              />
            </View>
            <Text style={styles.eyebrow}>{eyebrow}</Text>
          </View>
          <MilestoneHeadline headline={headline} highlight={headlineHighlight} />
          <Text style={styles.body}>{body}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadowShell: {
    borderRadius: radius.lg,
    ...shadow.card,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  card: {
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  copy: {
    zIndex: 1,
    padding: spacing.md,
    gap: spacing.xs,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 2,
  },
  iconWrap: {
    width: 24,
    height: 24,
    borderRadius: radius.sm,
    backgroundColor: colors.sidebar,
    alignItems: 'center',
    justifyContent: 'center',
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
