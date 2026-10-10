import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { env } from '../../../../shared/config/env';
import { appPlatform } from '../../../../shared/platform/runtime';
import { Text } from '../../../../shared/ui/Text';
import { colors, radius, spacing, typography } from '../../../../shared/theme/tokens';
import type { BillingPlan } from '../../../billing/domain/types';
import {
  COMPARE_ROWS,
  PLAN_PAID_BODY,
  PLAN_PAID_TITLE,
  PLANS_LOADING,
  PLANS_UNAVAILABLE,
  renewalNotice,
  RESTORE_LABEL,
} from '../../domain/onboardingFlow';
import {
  planPerMonthLine,
  planPriceLine,
  type SubscriptionPlans,
} from '../../domain/onboardingPlans';
import { PlanCard } from './PlanCard';

type Props = {
  plans: SubscriptionPlans;
  canBuy: boolean;
  isLoading: boolean;
  isPaid: boolean;
  isPurchasing: boolean;
  error: string | null;
  onBuy: (plan: BillingPlan) => void;
  onRestore: () => void;
};

function openLegal(path: 'terms' | 'privacy') {
  void Linking.openURL(`${env.shareBaseUrl}/${path}`);
}

function CompareTable() {
  return (
    <View style={styles.table} accessibilityRole="summary">
      <View style={styles.tableRow}>
        <View style={styles.cellLabel} />
        <Text style={[styles.cellHead, styles.cellValue]}>Free</Text>
        <Text style={[styles.cellHead, styles.cellValue, styles.proHead]}>Pro</Text>
      </View>
      {COMPARE_ROWS.map((row, i) => (
        <View key={row.id} style={[styles.tableRow, i > 0 && styles.tableRowBorder]}>
          <Text style={[styles.cellLabel, styles.labelText]}>{row.label}</Text>
          <Text style={[styles.cellValue, styles.valueText]}>{row.free}</Text>
          <Text style={[styles.cellValue, styles.valueText, styles.proValue]}>{row.pro}</Text>
        </View>
      ))}
    </View>
  );
}

export function PlanStep({
  plans,
  canBuy,
  isLoading,
  isPaid,
  isPurchasing,
  error,
  onBuy,
  onRestore,
}: Props) {
  const savings = plans.yearlySavingsPercent;

  return (
    <View style={styles.root}>
      {isPaid ? (
        <View style={styles.paid}>
          <Text style={styles.paidTitle}>{PLAN_PAID_TITLE}</Text>
          <Text style={styles.paidBody}>{PLAN_PAID_BODY}</Text>
        </View>
      ) : canBuy ? (
        <View style={styles.plans}>
          {plans.yearly ? (
            <PlanCard
              title={plans.yearly.title}
              priceLine={planPriceLine(plans.yearly)}
              perMonthLine={planPerMonthLine(plans.yearly)}
              savingsLine={savings ? `Save ${savings}%` : null}
              highlighted
              disabled={isPurchasing}
              loading={isPurchasing}
              onPress={() => onBuy(plans.yearly as BillingPlan)}
            />
          ) : null}
          {plans.monthly ? (
            <PlanCard
              title={plans.monthly.title}
              priceLine={planPriceLine(plans.monthly)}
              disabled={isPurchasing}
              onPress={() => onBuy(plans.monthly as BillingPlan)}
            />
          ) : null}
        </View>
      ) : (
        <Text style={styles.unavailable}>
          {isLoading ? PLANS_LOADING : PLANS_UNAVAILABLE}
        </Text>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <CompareTable />

      {isPaid ? null : <Text style={styles.notice}>{renewalNotice(appPlatform())}</Text>}

      <View style={styles.links}>
        <Pressable accessibilityRole="button" onPress={onRestore} hitSlop={8} disabled={isPurchasing}>
          <Text style={styles.link}>{RESTORE_LABEL}</Text>
        </Pressable>
        <Text style={styles.dot}>·</Text>
        <Pressable accessibilityRole="link" onPress={() => openLegal('terms')} hitSlop={8}>
          <Text style={styles.link}>Terms</Text>
        </Pressable>
        <Text style={styles.dot}>·</Text>
        <Pressable accessibilityRole="link" onPress={() => openLegal('privacy')} hitSlop={8}>
          <Text style={styles.link}>Privacy</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.md },
  table: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  tableRowBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  cellLabel: { flex: 1.5 },
  cellValue: { flex: 1, textAlign: 'center' },
  cellHead: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightSemibold,
    color: colors.muted,
  },
  proHead: { color: colors.accentHover },
  labelText: { fontSize: typography.sizeSm, color: colors.inkSoft },
  valueText: { fontSize: typography.sizeSm, color: colors.inkSoft },
  proValue: { color: colors.ink, fontWeight: typography.weightSemibold },
  plans: { gap: spacing.sm },
  paid: {
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.accent,
    backgroundColor: colors.sidebar,
    gap: spacing.xs,
  },
  paidTitle: {
    fontSize: typography.sizeLg,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
  },
  paidBody: { fontSize: typography.sizeMd, lineHeight: typography.sizeMd * 1.4, color: colors.inkSoft },
  unavailable: {
    fontSize: typography.sizeSm,
    lineHeight: typography.sizeSm * 1.45,
    color: colors.muted,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  error: { fontSize: typography.sizeSm, color: colors.error, textAlign: 'center' },
  notice: {
    fontSize: typography.sizeXs,
    lineHeight: typography.sizeXs * 1.5,
    color: colors.muted,
    textAlign: 'center',
  },
  links: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: spacing.sm },
  link: {
    fontSize: typography.sizeSm,
    color: colors.accentHover,
    fontWeight: typography.weightMedium,
    textDecorationLine: 'underline',
  },
  dot: { color: colors.muted },
});
