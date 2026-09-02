import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../../../../shared/ui/Text';
import { Button } from '../../../../shared/ui/Button';
import { ModalCloseButton } from '../../../../shared/ui/ModalCloseButton';
import { colors, radius, spacing, typography } from '../../../../shared/theme/tokens';

const OVERLAY = 'rgba(42, 34, 32, 0.45)';

type Props = {
  visible: boolean;
  onClose: () => void;
};

const PERKS = [
  'Unlimited cards each month',
  'Links active for 365 days',
  'Vault + auto-send (coming soon)',
] as const;

export function PaywallModal({ visible, onClose }: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      accessibilityViewIsModal
    >
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Dismiss paywall"
      >
        <Pressable
          style={styles.sheet}
          onPress={(e) => e.stopPropagation()}
          accessibilityRole="none"
        >
          <View style={styles.sheetTop}>
            <ModalCloseButton onPress={onClose} accessibilityLabel="Close paywall" />
          </View>
          <Text style={styles.eyebrow}>Free plan</Text>
          <Text style={styles.title}>One wish per month</Text>
          <Text style={styles.body}>
            You&apos;ve used your free card for this month. Upgrade for unlimited cards and
            links that last a full year.
          </Text>
          <View style={styles.perks}>
            {PERKS.map((perk) => (
              <View key={perk} style={styles.perkRow}>
                <View style={styles.perkDot} accessibilityElementsHidden />
                <Text style={styles.perk}>{perk}</Text>
              </View>
            ))}
          </View>
          <View style={styles.actions}>
            <Button label="See plans" onPress={onClose} accessibilityLabel="See subscription plans" />
            <Button label="Maybe later" variant="ghost" onPress={onClose} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: OVERLAY,
    justifyContent: 'flex-end',
    padding: spacing.lg,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sheetTop: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: -spacing.xs,
    marginBottom: spacing.xs,
    marginHorizontal: -spacing.xs,
  },
  eyebrow: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightMedium,
    color: colors.accent,
  },
  title: {
    marginTop: spacing.sm,
    fontSize: typography.sizeXl,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
  },
  body: {
    marginTop: spacing.sm,
    fontSize: typography.sizeSm,
    lineHeight: typography.sizeSm * 1.5,
    color: colors.inkSoft,
  },
  perks: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  perkDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
  },
  perk: {
    flex: 1,
    fontSize: typography.sizeSm,
    color: colors.inkSoft,
  },
  actions: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
});
