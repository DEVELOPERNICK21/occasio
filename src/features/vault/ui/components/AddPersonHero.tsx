import { StyleSheet, View } from 'react-native';
import { Text } from '../../../../shared/ui/Text';
import { colors, radius, spacing, typography } from '../../../../shared/theme/tokens';

export function AddPersonHero() {
  return (
    <View style={styles.root}>
      <View style={styles.iconRing}>
        <View style={styles.personHead} />
        <View style={styles.personBody} />
        <View style={styles.plusBadge}>
          <Text style={styles.plus}>+</Text>
        </View>
      </View>
      <Text style={styles.tagline}>
        Secure a legacy for those who matter most.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  iconRing: {
    width: 88,
    height: 88,
    borderRadius: radius.full,
    backgroundColor: colors.sidebar,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  personHead: {
    width: 18,
    height: 18,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
    marginBottom: 2,
  },
  personBody: {
    width: 28,
    height: 14,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    backgroundColor: colors.accent,
  },
  plusBadge: {
    position: 'absolute',
    right: 14,
    bottom: 14,
    width: 22,
    height: 22,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.sidebar,
  },
  plus: {
    fontSize: 14,
    lineHeight: 16,
    fontWeight: typography.weightSemibold,
    color: colors.white,
    marginTop: -1,
  },
  tagline: {
    fontSize: typography.sizeMd,
    lineHeight: typography.sizeMd * 1.45,
    color: colors.inkSoft,
    textAlign: 'center',
    fontStyle: 'italic',
    maxWidth: 280,
  },
});
