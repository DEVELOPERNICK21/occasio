import { Pressable, StyleSheet } from 'react-native';
import { Text } from './Text';
import { colors, radius, shadow, spacing } from '../theme/tokens';

type Props = {
  onPress: () => void;
  accessibilityLabel?: string;
};

export function FloatingFab({
  onPress,
  accessibilityLabel = 'Create',
}: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [styles.fab, pressed && styles.pressed]}
    >
      <Text style={styles.icon}>+</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
    ...shadow.card,
    shadowOpacity: 0.2,
    elevation: 6,
  },
  pressed: {
    opacity: 0.92,
  },
  icon: {
    fontSize: 28,
    lineHeight: 30,
    fontWeight: '600',
    color: colors.ink,
  },
});
