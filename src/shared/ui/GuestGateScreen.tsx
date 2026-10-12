import type { ComponentType } from 'react';
import { StyleSheet, View } from 'react-native';
import { Check } from 'lucide-react-native';
import type { LucideProps } from 'lucide-react-native';
import type { PipSpot } from '../mascot/pipSpots';
import { Button } from './Button';
import { PipFriend } from './PipFriend';
import { Screen } from './Screen';
import { Text } from './Text';
import { colors, radius, spacing, typography } from '../theme/tokens';

type Props = {
  title: string;
  /** One sentence on what this tab is for. */
  headline: string;
  /** What signing in unlocks — short, concrete, true. */
  benefits: readonly string[];
  /** Pip stands here instead of an icon, and says something when tapped. Prefer this. */
  mascot?: PipSpot;
  /** Used when there is no mascot. */
  icon?: ComponentType<LucideProps>;
  onSignIn: () => void;
};

const BADGE_ICON_SIZE = 30;
const PIP_SIZE = 148;
const CHECK_SIZE = 14;

/** Shared gate for tabs that require sign-in — no feature ui imports. */
export function GuestGateScreen({
  title,
  headline,
  benefits,
  mascot,
  icon: Icon,
  onSignIn,
}: Props) {
  return (
    <Screen title={title}>
      <View style={styles.hero}>
        {mascot ? (
          <View style={styles.mascot}>
            <PipFriend spot={mascot} size={PIP_SIZE} />
          </View>
        ) : Icon ? (
          <View style={styles.badge}>
            <Icon size={BADGE_ICON_SIZE} color={colors.accent} strokeWidth={1.9} absoluteStrokeWidth />
          </View>
        ) : null}
        <Text style={styles.headline}>{headline}</Text>
      </View>

      <View style={styles.benefits}>
        {benefits.map((benefit) => (
          <View key={benefit} style={styles.benefitRow}>
            <View style={styles.check}>
              <Check size={CHECK_SIZE} color={colors.sage} strokeWidth={2.6} absoluteStrokeWidth />
            </View>
            <Text style={styles.benefit}>{benefit}</Text>
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        <Button label="Sign in or create account" onPress={onSignIn} />
        <Text style={styles.guest}>
          You can still create and share cards without an account.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  mascot: {
    marginTop: spacing.lg,
  },
  badge: {
    width: 84,
    height: 84,
    borderRadius: radius.full,
    backgroundColor: colors.sidebar,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headline: {
    maxWidth: 300,
    fontSize: typography.sizeLg,
    lineHeight: typography.sizeLg * 1.3,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  benefits: {
    marginTop: spacing.lg,
    padding: spacing.md,
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: radius.full,
    backgroundColor: colors.sageSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefit: {
    flex: 1,
    fontSize: typography.sizeSm,
    lineHeight: typography.sizeSm * 1.4,
    color: colors.inkSoft,
  },
  actions: {
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  guest: {
    fontSize: typography.sizeXs,
    lineHeight: typography.sizeXs * 1.5,
    color: colors.muted,
    textAlign: 'center',
  },
});
