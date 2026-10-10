import type { ComponentType } from 'react';
import { StyleSheet, View } from 'react-native';
import type { LucideProps } from 'lucide-react-native';
import { colors, radius, spacing, typography } from '../theme/tokens';
import { Button } from './Button';
import { Text } from './Text';

type Props = {
  icon: ComponentType<LucideProps>;
  title: string;
  body: string;
  /** One clear next step. Omit only when there is genuinely nothing to do. */
  actionLabel?: string;
  onAction?: () => void;
  actionVariant?: 'primary' | 'secondary';
};

const ICON_SIZE = 28;

/** Zero-data and recoverable-error surface: icon, one line of why, one action. */
export function EmptyState({
  icon: Icon,
  title,
  body,
  actionLabel,
  onAction,
  actionVariant = 'primary',
}: Props) {
  return (
    <View style={styles.root}>
      <View style={styles.badge}>
        <Icon size={ICON_SIZE} color={colors.accent} strokeWidth={1.9} absoluteStrokeWidth />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{body}</Text>
      </View>
      {actionLabel && onAction ? (
        <View style={styles.action}>
          <Button label={actionLabel} variant={actionVariant} onPress={onAction} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  badge: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    backgroundColor: colors.sidebar,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    gap: spacing.sm,
    alignItems: 'center',
  },
  title: {
    fontSize: typography.sizeLg,
    lineHeight: typography.sizeLg * 1.25,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  body: {
    maxWidth: 300,
    fontSize: typography.sizeSm,
    lineHeight: typography.sizeSm * 1.5,
    color: colors.inkSoft,
    textAlign: 'center',
  },
  action: {
    // Full width up to a cap; the parent's alignItems centres it once capped.
    width: '100%',
    maxWidth: 300,
    marginTop: spacing.sm,
  },
});
