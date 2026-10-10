import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Check, Copy, Ellipsis, Plus, Share2 } from 'lucide-react-native';
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
  /** Returns true when the link was actually copied. */
  onCopy: () => boolean;
  onCreateNew: () => void;
  onMenu: () => void;
};

const MENU_SIZE = 44;
const ACTION_ICON_SIZE = 16;
const COPIED_RESET_MS = 1800;

export function HistoryWishCard({
  entry,
  theme,
  statusHeadline,
  expired,
  onPress,
  onShare,
  onCopy,
  onCreateNew,
  onMenu,
}: Props) {
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    },
    [],
  );

  const handleCopy = () => {
    if (!onCopy()) return;
    setCopied(true);
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setCopied(false), COPIED_RESET_MS);
  };

  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${entry.recipientName}, ${theme.label}. ${statusHeadline}`}
        accessibilityHint="Opens this card"
        onPress={onPress}
        style={({ pressed }) => [styles.open, pressed && styles.pressed]}
      >
        <View style={styles.header}>
          <View style={[styles.avatar, { backgroundColor: theme.softBackground }]}>
            <Text style={styles.avatarText}>{recipientInitials(entry.recipientName)}</Text>
          </View>
          <View style={styles.headerCopy}>
            <Text style={styles.name} numberOfLines={1}>
              {entry.recipientName}
            </Text>
            <Text style={styles.meta} numberOfLines={1}>
              {theme.label} · Shared {formatHistoryDate(entry.createdAt)}
            </Text>
          </View>
        </View>

        <View style={styles.status}>
          <View style={[styles.dot, expired ? styles.dotExpired : styles.dotActive]} />
          <Text style={[styles.statusText, expired && styles.statusTextExpired]}>
            {statusHeadline}
          </Text>
        </View>

        {entry.message ? (
          <Text style={styles.messagePreview} numberOfLines={2}>
            “{entry.message.trim()}”
          </Text>
        ) : null}
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Options for ${entry.recipientName}`}
        onPress={onMenu}
        hitSlop={spacing.xs}
        style={({ pressed }) => [styles.menu, pressed && styles.pressed]}
      >
        <Ellipsis size={20} color={colors.muted} strokeWidth={2} absoluteStrokeWidth />
      </Pressable>

      {expired ? (
        <Pressable
          accessibilityRole="button"
          onPress={onCreateNew}
          style={({ pressed }) => [styles.secondaryAction, pressed && styles.pressed]}
        >
          <Plus size={ACTION_ICON_SIZE} color={colors.ink} strokeWidth={2.2} absoluteStrokeWidth />
          <Text style={styles.secondaryLabel}>Make a new card</Text>
        </Pressable>
      ) : (
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            onPress={onShare}
            style={({ pressed }) => [styles.primaryAction, pressed && styles.pressed]}
          >
            <Share2
              size={ACTION_ICON_SIZE}
              color={colors.white}
              strokeWidth={2.2}
              absoluteStrokeWidth
            />
            <Text style={styles.primaryLabel}>Share again</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={copied ? 'Link copied' : 'Copy link'}
            accessibilityLiveRegion="polite"
            onPress={handleCopy}
            style={({ pressed }) => [styles.secondaryAction, styles.flex, pressed && styles.pressed]}
          >
            {copied ? (
              <Check size={ACTION_ICON_SIZE} color={colors.sage} strokeWidth={2.4} absoluteStrokeWidth />
            ) : (
              <Copy size={ACTION_ICON_SIZE} color={colors.ink} strokeWidth={2.2} absoluteStrokeWidth />
            )}
            <Text style={styles.secondaryLabel}>{copied ? 'Copied' : 'Copy link'}</Text>
          </Pressable>
        </View>
      )}
    </View>
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
  open: {
    gap: spacing.md,
  },
  pressed: {
    opacity: 0.85,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    // Keeps long names clear of the options button.
    paddingRight: MENU_SIZE - spacing.sm,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
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
  meta: {
    fontSize: typography.sizeSm,
    color: colors.inkSoft,
  },
  menu: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: MENU_SIZE,
    height: MENU_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
  },
  dotActive: {
    backgroundColor: colors.sage,
  },
  dotExpired: {
    backgroundColor: colors.muted,
  },
  statusText: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightMedium,
    color: colors.ink,
  },
  statusTextExpired: {
    color: colors.inkSoft,
  },
  messagePreview: {
    fontSize: typography.sizeSm,
    lineHeight: typography.sizeSm * 1.5,
    color: colors.inkSoft,
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
    gap: spacing.sm,
  },
  primaryLabel: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightSemibold,
    color: colors.white,
  },
  secondaryAction: {
    minHeight: 44,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  secondaryLabel: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
  },
});
