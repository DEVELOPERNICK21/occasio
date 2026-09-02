import type { ReactNode, RefObject } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import type { ScrollView as ScrollViewType } from 'react-native';
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
  /** Hide title block — home-style surfaces that lead with content cards. */
  hideHeader?: boolean;
  /** Top-left back control — familiar stack navigation (Jakob's Law). */
  onBack?: () => void;
  /** Attach for tab re-press scroll-to-top via `useScrollToTop`. */
  scrollRef?: RefObject<ScrollViewType | null>;
  scroll?: boolean;
  step?: StepProgress;
};

/** Room for sticky footer CTA above the floating tab bar. */
const FOOTER_SCROLL_RESERVE = 96;

export function Screen({
  title,
  subtitle,
  children,
  footer,
  headerAction,
  hideHeader = false,
  onBack,
  scrollRef,
  scroll = true,
  step,
}: Props) {
  const insets = useSafeAreaInsets();
  const scrollBottomPadding = spacing.xl + (footer ? FOOTER_SCROLL_RESERVE : 0);
  const scrollContentStyle = [
    styles.bodyContent,
    hideHeader && styles.bodyContentFlush,
    { paddingBottom: scrollBottomPadding },
  ];

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {hideHeader ? null : (
        <View style={styles.header}>
          {onBack ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              onPress={onBack}
              hitSlop={8}
              style={styles.backButton}
            >
              <Text style={styles.backLabel}>←</Text>
            </Pressable>
          ) : null}
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
      )}
      {scroll ? (
        <ScrollView
          ref={scrollRef}
          style={styles.body}
          contentContainerStyle={scrollContentStyle}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={styles.body}>{children}</View>
      )}
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
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  backButton: {
    alignSelf: 'flex-start',
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
    marginBottom: spacing.xs,
    marginLeft: -spacing.xs,
  },
  backLabel: {
    fontSize: typography.sizeXl,
    lineHeight: typography.sizeXl,
    fontWeight: typography.weightMedium,
    color: colors.accent,
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
    lineHeight: typography.sizeXl * 1.12,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
    letterSpacing: -0.4,
  },
  subtitle: {
    marginTop: spacing.sm,
    fontSize: typography.sizeSm,
    lineHeight: typography.sizeSm * 1.45,
    color: colors.inkSoft,
    maxWidth: 320,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingHorizontal: spacing.lg,
    flexGrow: 1,
  },
  bodyContentFlush: {
    paddingTop: spacing.lg,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
  },
});
