import { Pressable, StyleSheet } from 'react-native';
import { colors, typography } from '../theme/tokens';
import { Text } from './Text';

type Props = {
  onPress: () => void;
  accessibilityLabel?: string;
};

/** Top-right dismiss control for modal sheets — not stack back navigation. */
export function ModalCloseButton({
  onPress,
  accessibilityLabel = 'Close',
}: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [styles.root, pressed && styles.pressed]}
    >
      <Text style={styles.label}>✕</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.65,
  },
  label: {
    fontSize: typography.sizeLg,
    lineHeight: typography.sizeLg,
    fontWeight: typography.weightMedium,
    color: colors.muted,
  },
});
