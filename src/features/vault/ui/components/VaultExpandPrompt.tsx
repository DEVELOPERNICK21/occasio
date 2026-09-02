import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../../../../shared/ui/Text';
import { colors, radius, spacing, typography } from '../../../../shared/theme/tokens';

type Props = {
  onPress?: () => void;
};

export function VaultExpandPrompt({ onPress }: Props) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : 'text'}
      onPress={onPress}
      style={styles.root}
    >
      <View style={styles.ring}>
        <Text style={styles.icon}>👤</Text>
        <Text style={styles.plus}>+</Text>
      </View>
      <Text style={styles.title}>The Vault expands as you grow.</Text>
      <Text style={styles.body}>Add your inner circle to start.</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  ring: {
    width: 88,
    height: 88,
    borderRadius: radius.full,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  icon: {
    fontSize: 28,
    lineHeight: 32,
    color: colors.muted,
  },
  plus: {
    position: 'absolute',
    right: 18,
    bottom: 14,
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
    color: colors.secondary,
  },
  title: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightSemibold,
    color: colors.inkSoft,
    textAlign: 'center',
  },
  body: {
    fontSize: typography.sizeSm,
    color: colors.muted,
    textAlign: 'center',
  },
});
