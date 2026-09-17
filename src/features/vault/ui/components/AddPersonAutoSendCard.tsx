import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../../../../shared/ui/Text';
import { colors, radius, spacing, typography } from '../../../../shared/theme/tokens';
import { AUTO_SEND_DELIVERY_COPY } from '../../domain/vaultOccasion';

type Props = {
  title: string;
  enabled: boolean;
  disabled: boolean;
  onToggle: () => void;
  body?: string;
};

export function AddPersonAutoSendCard({
  title,
  enabled,
  disabled,
  onToggle,
  body = AUTO_SEND_DELIVERY_COPY,
}: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{body}</Text>
      </View>
      <Pressable
        accessibilityRole="switch"
        accessibilityLabel={title}
        accessibilityState={{ checked: enabled, disabled }}
        disabled={disabled}
        onPress={onToggle}
        style={[styles.toggle, enabled && styles.toggleOn, disabled && styles.toggleDisabled]}
      >
        <View style={[styles.knob, enabled && styles.knobOn]} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.sidebar,
    borderWidth: 1,
    borderColor: colors.border,
  },
  copy: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
    letterSpacing: -0.1,
  },
  body: {
    fontSize: typography.sizeXs,
    lineHeight: typography.sizeXs * 1.5,
    color: colors.inkSoft,
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: colors.border,
    padding: 2,
    justifyContent: 'center',
  },
  toggleOn: {
    backgroundColor: colors.accent,
  },
  toggleDisabled: {
    opacity: 0.5,
  },
  knob: {
    width: 24,
    height: 24,
    borderRadius: radius.full,
    backgroundColor: colors.white,
  },
  knobOn: {
    alignSelf: 'flex-end',
  },
});
