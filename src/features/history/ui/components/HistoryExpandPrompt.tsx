import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../../../../shared/ui/Text';
import { colors, radius, spacing, typography } from '../../../../shared/theme/tokens';

type Props = {
  onPress?: () => void;
};

export function HistoryExpandPrompt({ onPress }: Props) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : 'text'}
      onPress={onPress}
      style={styles.root}
    >
      <View style={styles.ring}>
        <Text style={styles.icon}>✨</Text>
      </View>
      <Text style={styles.title}>Your story starts with one wish.</Text>
      <Text style={styles.body}>
        Share a card while signed in and it will appear here to resend anytime.
      </Text>
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
  },
  title: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightSemibold,
    color: colors.inkSoft,
    textAlign: 'center',
  },
  body: {
    fontSize: typography.sizeSm,
    lineHeight: typography.sizeSm * 1.45,
    color: colors.muted,
    textAlign: 'center',
  },
});
