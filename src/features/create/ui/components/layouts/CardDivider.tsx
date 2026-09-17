import { StyleSheet, View } from 'react-native';
import { colors, spacing } from '../../../../../shared/theme/tokens';

/** Quiet invitation-style rule between occasion and name. */
export function CardDivider() {
  return (
    <View style={styles.row} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={styles.line} />
      <View style={styles.spark} />
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginVertical: spacing.sm,
    width: '72%',
    maxWidth: 220,
  },
  line: {
    flex: 1,
    height: StyleSheet.hairlineWidth * 2,
    backgroundColor: colors.border,
  },
  spark: {
    width: 6,
    height: 6,
    backgroundColor: colors.accent,
    transform: [{ rotate: '45deg' }],
    opacity: 0.85,
  },
});
