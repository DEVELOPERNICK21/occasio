import { StyleSheet, View } from 'react-native';
import { Text } from '../../../../shared/ui/Text';
import { colors, spacing, typography } from '../../../../shared/theme/tokens';

type Props = {
  greeting: string;
  headline: string;
  line: string;
};

/** First-fold hero — emotional, scannable in ~2 seconds. */
export function CreateHomeHero({ greeting, headline, line }: Props) {
  return (
    <View style={styles.wrap} accessibilityRole="header">
      <Text style={styles.greeting}>{greeting}</Text>
      <Text style={styles.headline}>{headline}</Text>
      <Text style={styles.line}>{line}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    gap: spacing.xs,
  },
  greeting: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightMedium,
    color: colors.muted,
    letterSpacing: 0.2,
  },
  headline: {
    fontSize: typography.sizeXl,
    lineHeight: typography.sizeXl * 1.15,
    fontWeight: typography.weightSemibold,
    letterSpacing: -0.4,
    color: colors.ink,
  },
  line: {
    marginTop: spacing.xs,
    fontSize: typography.sizeMd,
    lineHeight: typography.sizeMd * 1.45,
    color: colors.inkSoft,
    maxWidth: 320,
  },
});
