import type { ReactNode, RefObject } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import type { ScrollView as ScrollViewType } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '../theme/tokens';
import { Text } from './Text';

type Props = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  /** Prefer `headerAction` or inline `ScreenActions` over sticky footers. */
  footer?: ReactNode;
  /** Trailing header CTA — compact accent action (Continue, Sign in, Save). */
  headerAction?: ReactNode;
  /** Soft absolute layer behind body (e.g. ambient motifs). */
  ambient?: ReactNode;
  /** Hide title block — home-style surfaces that lead with content cards. */
  hideHeader?: boolean;
  /** Top-left back control — familiar stack navigation (Jakob's Law). */
  onBack?: () => void;
  /** Attach for tab re-press scroll-to-top via `useScrollToTop`. */
  scrollRef?: RefObject<ScrollViewType | null>;
  scroll?: boolean;
  /** Progress through a multi-screen flow, shown above the title. */
  progress?: ReactNode;
};

/** Room for sticky footer CTA above the floating tab bar. */
const FOOTER_SCROLL_RESERVE = 96;

export function Screen({
  title,
  subtitle,
  children,
  footer,
  headerAction,
  ambient,
  hideHeader = false,
  onBack,
  scrollRef,
  scroll = true,
  progress,
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
          {progress}
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
      {/*
        Ambient must sit ABOVE ScrollView. On Android, ScrollView is its own
        surface — siblings behind it never show through, even if transparent.
      */}
      {ambient ? (
        <View style={styles.ambient} pointerEvents="none">
          {ambient}
        </View>
      ) : null}
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
  ambient: {
    ...StyleSheet.absoluteFill,
    zIndex: 2,
    elevation: 2,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    zIndex: 1,
    elevation: 1,
    backgroundColor: 'transparent',
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
    zIndex: 1,
    elevation: 1,
    backgroundColor: 'transparent',
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
