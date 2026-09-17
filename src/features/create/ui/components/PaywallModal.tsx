import { ActivityIndicator, Modal, Pressable, StyleSheet, View } from 'react-native';
import type { BillingPlan } from '../../../billing/domain/types';
import { Text } from '../../../../shared/ui/Text';
import { Button } from '../../../../shared/ui/Button';
import { ModalCloseButton } from '../../../../shared/ui/ModalCloseButton';
import { colors, radius, spacing, typography } from '../../../../shared/theme/tokens';

const OVERLAY = 'rgba(42, 34, 32, 0.45)';

type Props = {
  visible: boolean;
  onClose: () => void;
  plans: BillingPlan[];
  isPurchasing: boolean;
  error?: string | null;
  onPurchase: (planId: string) => void;
  onRestore: () => void;
};

const PERKS = [
  'Unlimited cards each month',
  'Links active for 365 days',
  'Save up to 5 people in Vault',
  'Priority support for Pro',
] as const;

export function PaywallModal({
  visible,
  onClose,
  plans,
  isPurchasing,
  error,
  onPurchase,
  onRestore,
}: Props) {
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

          {plans.length > 0 ? (
            <View style={styles.plans}>
              {plans.map((plan) => (
                <Pressable
                  key={plan.id}
                  accessibilityRole="button"
                  disabled={isPurchasing}
                  onPress={() => onPurchase(plan.id)}
                  style={({ pressed }) => [
                    styles.planRow,
                    pressed && !isPurchasing && styles.planRowPressed,
                  ]}
                >
                  <View style={styles.planCopy}>
                    <Text style={styles.planTitle}>{plan.title}</Text>
                    <Text style={styles.planPeriod}>{plan.periodLabel}</Text>
                  </View>
                  <Text style={styles.planPrice}>{plan.priceLabel}</Text>
                </Pressable>
              ))}
            </View>
          ) : (
            <Text style={styles.setupHint}>
              Plans will appear here once RevenueCat and Play products are connected.
            </Text>
          )}

          {isPurchasing ? (
            <ActivityIndicator style={styles.loader} color={colors.accent} />
          ) : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.actions}>
            <Button
              label="Restore purchases"
              variant="ghost"
              disabled={isPurchasing}
              onPress={onRestore}
            />
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
    maxHeight: '88%',
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
  plans: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
  },
  planRowPressed: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  planCopy: {
    flex: 1,
    gap: 2,
  },
  planTitle: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
  },
  planPeriod: {
    fontSize: typography.sizeXs,
    color: colors.muted,
  },
  planPrice: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightSemibold,
    color: colors.accent,
  },
  setupHint: {
    marginTop: spacing.md,
    fontSize: typography.sizeSm,
    lineHeight: typography.sizeSm * 1.45,
    color: colors.muted,
  },
  loader: {
    marginTop: spacing.md,
  },
  error: {
    marginTop: spacing.sm,
    fontSize: typography.sizeSm,
    color: colors.error,
    lineHeight: typography.sizeSm * 1.4,
  },
  actions: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
});
