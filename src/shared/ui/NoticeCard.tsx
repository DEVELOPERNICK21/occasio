import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { CircleAlert, Clock, Info } from 'lucide-react-native';
import { colors, radius, spacing, typography } from '../theme/tokens';
import { Text } from './Text';

export type NoticeTone = 'pending' | 'problem' | 'info';

type Props = {
  tone: NoticeTone;
  title: string;
  message: string;
  /** The one thing the person can do about it, as a quiet text button (never a second primary action). */
  actionLabel?: string;
  onAction?: () => void;
  /** The action is running; show that instead of letting it be tapped twice. */
  busy?: boolean;
  onDismiss?: () => void;
};

const ICON_SIZE = 20;

const TONES = {
  // Waiting is not wrong: warm and calm, not red.
  pending: { Icon: Clock, accent: colors.secondary, wash: colors.butterSoft, icon: colors.ink },
  problem: { Icon: CircleAlert, accent: colors.error, wash: colors.errorSoft, icon: colors.error },
  info: { Icon: Info, accent: colors.sage, wash: colors.sageSoft, icon: colors.sage },
} as const;

/**
 * A short, calm explanation: what happened, what it means for the person, and at most one thing to do.
 * Used for payments, where "error 20" is no help to anyone.
 */
export function NoticeCard({
  tone,
  title,
  message,
  actionLabel,
  onAction,
  busy = false,
  onDismiss,
}: Props) {
  const { Icon, accent, wash, icon } = TONES[tone];

  return (
    <View
      style={[styles.card, { backgroundColor: wash, borderColor: accent }]}
      accessibilityRole={tone === 'problem' ? 'alert' : undefined}
      accessibilityLiveRegion="polite"
    >
      <View style={styles.icon}>
        <Icon size={ICON_SIZE} color={icon} strokeWidth={1.9} absoluteStrokeWidth />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
        {actionLabel || onDismiss ? (
          <View style={styles.actions}>
            {actionLabel && onAction ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={actionLabel}
                disabled={busy}
                onPress={onAction}
                hitSlop={8}
                style={styles.action}
              >
                {busy ? (
                  <ActivityIndicator size="small" color={colors.ink} />
                ) : (
                  <Text style={styles.actionLabel}>{actionLabel}</Text>
                )}
              </Pressable>
            ) : null}
            {onDismiss ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Dismiss"
                onPress={onDismiss}
                hitSlop={8}
                style={styles.action}
              >
                <Text style={styles.dismissLabel}>Dismiss</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: spacing.sm + 2,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  icon: {
    paddingTop: 1,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  title: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
  },
  message: {
    fontSize: typography.sizeSm,
    lineHeight: typography.sizeSm * 1.45,
    color: colors.inkSoft,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  action: {
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
    textDecorationLine: 'underline',
  },
  dismissLabel: {
    fontSize: typography.sizeSm,
    color: colors.muted,
  },
});
