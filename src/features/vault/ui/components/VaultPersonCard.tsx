import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../../../../shared/ui/Text';
import { colors, radius, spacing, typography } from '../../../../shared/theme/tokens';
import type { VaultCardTheme } from '../../domain/vaultCardTheme';
import { personInitials } from '../../domain/vaultCardTheme';
import type { PersonNextOccasion } from '../../domain/vaultOccasion';
import type { VaultPerson } from '../../domain/types';

type Props = {
  person: VaultPerson;
  theme: VaultCardTheme;
  occasion: PersonNextOccasion;
  autoSendEnabled: boolean;
  autoSendDisabled: boolean;
  onAutoSendToggle: () => void;
  onOpenVault: () => void;
  onNote: () => void;
  onMenu: () => void;
};

export function VaultPersonCard({
  person,
  theme,
  occasion,
  autoSendEnabled,
  autoSendDisabled,
  onAutoSendToggle,
  onOpenVault,
  onNote,
  onMenu,
}: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: theme.softBackground }]}>
          <Text style={[styles.avatarText, { color: theme.accent }]}>
            {personInitials(person.personName)}
          </Text>
        </View>
        <View style={styles.headerCopy}>
          <Text style={styles.name} numberOfLines={1}>
            {person.personName}
          </Text>
          <View style={[styles.tag, { backgroundColor: theme.softBackground }]}>
            <Text style={[styles.tagLabel, { color: theme.accent }]}>
              {theme.tagLabel}
            </Text>
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Options for ${person.personName}`}
          onPress={onMenu}
          hitSlop={10}
          style={styles.menuButton}
        >
          <Text style={styles.menu}>⋮</Text>
        </Pressable>
      </View>

      <View style={[styles.occasionBanner, { backgroundColor: theme.softBackground }]}>
        <Text style={styles.occasionEyebrow}>
          {occasion.icon} NEXT OCCASION
        </Text>
        <Text style={[styles.occasionHeadline, { color: theme.accent }]}>
          {occasion.headline}
        </Text>
      </View>

      <View style={styles.autoSendRow}>
        <View style={styles.autoSendCopy}>
          <Text style={styles.autoSendTitle}>Auto-send Wishes</Text>
          <Text style={styles.autoSendHint}>Sends curated gift & message</Text>
        </View>
        <Pressable
          accessibilityRole="switch"
          accessibilityState={{
            checked: autoSendEnabled,
            disabled: autoSendDisabled,
          }}
          disabled={autoSendDisabled}
          onPress={onAutoSendToggle}
          style={[
            styles.toggle,
            autoSendEnabled && styles.toggleOn,
            autoSendDisabled && styles.toggleDisabled,
          ]}
        >
          <View style={[styles.toggleKnob, autoSendEnabled && styles.toggleKnobOn]} />
        </Pressable>
      </View>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          onPress={onOpenVault}
          style={styles.primaryAction}
        >
          <Text style={styles.primaryIcon}>🔒</Text>
          <Text style={styles.primaryLabel}>Open Vault</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={onNote}
          style={styles.secondaryAction}
        >
          <Text style={styles.secondaryIcon}>📝</Text>
          <Text style={styles.secondaryLabel}>Note</Text>
        </Pressable>
      </View>
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
  occasionBanner: {
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
  },
  occasionEyebrow: {
    fontSize: 10,
    fontWeight: typography.weightSemibold,
    letterSpacing: 0.8,
    color: colors.muted,
    textTransform: 'uppercase',
  },
  occasionHeadline: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
    textAlign: 'center',
  },
  autoSendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  autoSendCopy: {
    flex: 1,
    gap: 2,
  },
  autoSendTitle: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
  },
  autoSendHint: {
    fontSize: typography.sizeXs,
    color: colors.muted,
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: colors.border,
    padding: 2,
    justifyContent: 'center',
  },
  toggleOn: {
    backgroundColor: colors.accent,
  },
  toggleDisabled: {
    opacity: 0.5,
  },
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: radius.full,
    backgroundColor: colors.white,
  },
  toggleKnobOn: {
    alignSelf: 'flex-end',
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
    lineHeight: 16,
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
    lineHeight: 16,
  },
  secondaryLabel: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
  },
});
