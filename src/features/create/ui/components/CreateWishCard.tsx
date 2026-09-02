import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../../../../shared/ui/Text';
import { colors, radius, spacing, typography } from '../../../../shared/theme/tokens';

type Props = {
  onPress: () => void;
};

export function CreateWishCard({ onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Create a wish"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.iconWrap}>
        <Text style={styles.icon}>♥</Text>
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>Create a wish</Text>
        <Text style={styles.subtitle}>Photos, message, shareable link</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.accent,
    gap: spacing.md,
    minHeight: 72,
  },
  pressed: {
    opacity: 0.92,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 18,
    lineHeight: 22,
    color: colors.white,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
    color: colors.white,
  },
  subtitle: {
    fontSize: typography.sizeXs,
    color: 'rgba(255,255,255,0.85)',
  },
  chevron: {
    fontSize: typography.sizeXl,
    color: colors.white,
    opacity: 0.9,
  },
});
