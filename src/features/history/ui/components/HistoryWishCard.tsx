import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../../../../shared/ui/Text';
import type { TemplateTheme } from '../../../create/domain/templateTheme';
import { colors, radius, spacing, typography } from '../../../../shared/theme/tokens';
import { recipientInitials } from '../../domain/historyList';
import type { HistoryEntry } from '../../domain/types';
import { formatHistoryDate } from '../../domain/historyRules';

type Props = {
  entry: HistoryEntry;
  theme: TemplateTheme;
  statusHeadline: string;
  expired: boolean;
  onPress: () => void;
  onShare: () => void;
  onCopy: () => void;
  onMenu: () => void;
};

export function HistoryWishCard({
  entry,
  theme,
  statusHeadline,
  expired,
  onPress,
  onShare,
  onCopy,
  onMenu,
}: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: theme.softBackground }]}>
          <Text style={[styles.avatarText, { color: theme.accent }]}>
            {recipientInitials(entry.recipientName)}
          </Text>
        </View>
        <View style={styles.headerCopy}>
          <Text style={styles.name} numberOfLines={1}>
            {entry.recipientName}
          </Text>
          <View style={[styles.tag, { backgroundColor: theme.softBackground }]}>
            <Text style={[styles.tagLabel, { color: theme.accent }]}>
              {theme.label.toUpperCase()}
            </Text>
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Options for ${entry.recipientName}`}
          onPress={onMenu}
          hitSlop={10}
          style={styles.menuButton}
        >
          <Text style={styles.menu}>⋮</Text>
        </Pressable>
      </View>

      <View style={[styles.statusBanner, { backgroundColor: theme.softBackground }]}>
        <Text style={styles.statusEyebrow}>
          {expired ? '⏱' : '🔗'} LINK STATUS
        </Text>
        <Text style={[styles.statusHeadline, { color: theme.accent }]}>
          {statusHeadline}
        </Text>
        <Text style={styles.statusMeta}>
          Shared {formatHistoryDate(entry.createdAt)}
        </Text>
      </View>

      {entry.message ? (
        <Text style={styles.messagePreview} numberOfLines={2}>
          “{entry.message.trim()}”
        </Text>
      ) : null}

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          onPress={onShare}
          disabled={expired}
          style={[styles.primaryAction, expired && styles.actionDisabled]}
        >
          <Text style={styles.primaryIcon}>↗</Text>
          <Text style={styles.primaryLabel}>Share again</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={onCopy}
          disabled={expired}
          style={[styles.secondaryAction, expired && styles.actionDisabled]}
        >
          <Text style={styles.secondaryIcon}>⎘</Text>
          <Text style={styles.secondaryLabel}>Copy link</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
  },
  pressed: {
    opacity: 0.96,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightSemibold,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  name: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
    letterSpacing: -0.2,
  },
  tag: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  tagLabel: {
    fontSize: 10,
    fontWeight: typography.weightSemibold,
    letterSpacing: 0.6,
  },
  menuButton: {
    padding: spacing.xs,
  },
  menu: {
    fontSize: typography.sizeLg,
    lineHeight: typography.sizeLg,
    color: colors.muted,
  },
  statusBanner: {
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
  },
  statusEyebrow: {
    fontSize: 10,
    fontWeight: typography.weightSemibold,
    letterSpacing: 0.8,
    color: colors.muted,
    textTransform: 'uppercase',
  },
  statusHeadline: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
    textAlign: 'center',
  },
  statusMeta: {
    fontSize: typography.sizeXs,
    color: colors.muted,
  },
  messagePreview: {
    fontSize: typography.sizeSm,
    lineHeight: typography.sizeSm * 1.45,
    color: colors.inkSoft,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  primaryAction: {
    flex: 1,
    minHeight: 44,
    borderRadius: radius.full,
    backgroundColor: colors.accentHover,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  primaryIcon: {
    fontSize: 14,
    color: colors.white,
  },
  primaryLabel: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightSemibold,
    color: colors.white,
  },
  secondaryAction: {
    flex: 1,
    minHeight: 44,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  secondaryIcon: {
    fontSize: 14,
    color: colors.ink,
  },
  secondaryLabel: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
  },
  actionDisabled: {
    opacity: 0.45,
  },
});
