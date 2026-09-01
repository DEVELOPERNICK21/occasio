import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing, typography } from '../theme/tokens';
import { Text } from './Text';

type StepProgress = {
  current: number;
  total: number;
};

type Props = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  /** Prefer `headerAction` or inline `ScreenActions` over sticky footers. */
  footer?: ReactNode;
  /** Trailing header CTA — compact accent action (Continue, Sign in, Save). */
  headerAction?: ReactNode;
  scroll?: boolean;
  step?: StepProgress;
};

export function Screen({
  title,
  subtitle,
  children,
  footer,
  headerAction,
  scroll = true,
  step,
}: Props) {
  const insets = useSafeAreaInsets();
  const Body = scroll ? ScrollView : View;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        {step ? (
          <View style={styles.stepRow}>
            {Array.from({ length: step.total }, (_, index) => {
              const active = index + 1 <= step.current;
              return (
                <View
                  key={index}
                  style={[styles.stepDot, active && styles.stepDotActive]}
                />
              );
            })}
            <Text style={styles.stepLabel}>
              Step {step.current} of {step.total}
            </Text>
          </View>
        ) : null}
        <View style={styles.titleRow}>
          <View style={styles.titleBlock}>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
          {headerAction}
        </View>
      </View>
      <Body
        style={styles.body}
        contentContainerStyle={scroll ? styles.bodyContent : undefined}
      >
        {children}
      </Body>
      {footer ? (
        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.sm }]}>
          {footer}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  stepDot: {
    width: 24,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.border,
  },
  stepDotActive: {
    backgroundColor: colors.accent,
  },
  stepLabel: {
    marginLeft: spacing.sm,
    fontSize: typography.sizeXs,
    color: colors.muted,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  titleBlock: {
    flex: 1,
  },
  title: {
    fontSize: typography.sizeXl,
    lineHeight: typography.sizeXl * 1.15,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
  },
  subtitle: {
    marginTop: spacing.xs,
    fontSize: typography.sizeMd,
    lineHeight: typography.sizeMd * 1.25,
    color: colors.muted,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
});
