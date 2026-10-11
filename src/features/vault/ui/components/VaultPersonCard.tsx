import { Pressable, StyleSheet, View } from 'react-native';
import { CalendarPlus, Cake, ChevronRight, Ellipsis, Heart } from 'lucide-react-native';
import { Text } from '../../../../shared/ui/Text';
import { colors, radius, spacing, typography } from '../../../../shared/theme/tokens';
import type { VaultCardTheme } from '../../domain/vaultCardTheme';
import { personInitials } from '../../domain/vaultCardTheme';
import {
  AUTO_SEND_DELIVERY_COPY,
  formatArmedOccasions,
  type PersonNextOccasion,
} from '../../domain/vaultOccasion';
import type { VaultPerson } from '../../domain/types';

type Props = {
  person: VaultPerson;
  theme: VaultCardTheme;
  occasion: PersonNextOccasion;
  autoSendBirthday: boolean;
  autoSendAnniversary: boolean;
  birthdayDisabled: boolean;
  anniversaryDisabled: boolean;
  /** Why the switches are off when they are, so nothing looks broken. */
  autoSendNote?: string;
  /** One-tap arm for the next occasion; replaces the two switches when set. */
  quickArm?: { label: string; onPress: () => void };
  onBirthdayToggle: () => void;
  onAnniversaryToggle: () => void;
  onOpen: () => void;
  onMenu: () => void;
};

const OCCASION_ICON_SIZE = 18;
const MENU_SIZE = 44;

const OCCASION_ICON = {
  birthday: Cake,
  anniversary: Heart,
  none: CalendarPlus,
} as const;

export function VaultPersonCard({
  person,
  theme,
  occasion,
  autoSendBirthday,
  autoSendAnniversary,
  birthdayDisabled,
  anniversaryDisabled,
  autoSendNote,
  quickArm,
  onBirthdayToggle,
  onAnniversaryToggle,
  onOpen,
  onMenu,
}: Props) {
  const armedLabel = formatArmedOccasions({ autoSendBirthday, autoSendAnniversary });
  const anyArmed = autoSendBirthday || autoSendAnniversary;
  const OccasionIcon = OCCASION_ICON[occasion.kind];
  const note = autoSendNote ?? (anyArmed ? AUTO_SEND_DELIVERY_COPY : undefined);

  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${person.personName}, ${theme.tagLabel}. ${occasion.headline}`}
        accessibilityHint="Opens this person"
        onPress={onOpen}
        style={({ pressed }) => [styles.open, pressed && styles.pressed]}
      >
        <View style={styles.header}>
          <View style={[styles.avatar, { backgroundColor: theme.softBackground }]}>
            <Text style={styles.avatarText}>{personInitials(person.personName)}</Text>
          </View>
          <View style={styles.headerCopy}>
            <Text style={styles.name} numberOfLines={1}>
              {person.personName}
            </Text>
            <View style={styles.tagRow}>
              <View style={[styles.dot, { backgroundColor: theme.accent }]} />
              <Text style={styles.tagLabel}>{theme.tagLabel}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.occasion, { backgroundColor: theme.softBackground }]}>
          <OccasionIcon
            size={OCCASION_ICON_SIZE}
            color={colors.ink}
            strokeWidth={2}
            absoluteStrokeWidth
          />
          <Text style={styles.occasionHeadline} numberOfLines={1}>
            {occasion.headline}
          </Text>
          <ChevronRight size={16} color={colors.muted} strokeWidth={2} absoluteStrokeWidth />
        </View>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Options for ${person.personName}`}
        onPress={onMenu}
        hitSlop={spacing.xs}
        style={({ pressed }) => [styles.menu, pressed && styles.pressed]}
      >
        <Ellipsis size={20} color={colors.muted} strokeWidth={2} absoluteStrokeWidth />
      </Pressable>

      <View style={styles.autoSend}>
        <View style={styles.autoSendHeader}>
          <Text style={styles.autoSendTitle}>Auto-send</Text>
          <Text style={styles.autoSendArmed}>{armedLabel}</Text>
        </View>
        {quickArm ? (
          <Pressable
            accessibilityRole="button"
            onPress={quickArm.onPress}
            style={({ pressed }) => [styles.quickArm, pressed && styles.pressed]}
          >
            <Text style={styles.quickArmLabel}>{quickArm.label}</Text>
          </Pressable>
        ) : (
          <>
            <ArmToggle
              label="Birthday"
              enabled={autoSendBirthday}
              disabled={birthdayDisabled}
              onToggle={onBirthdayToggle}
            />
            <ArmToggle
              label="Anniversary"
              enabled={autoSendAnniversary}
              disabled={anniversaryDisabled}
              onToggle={onAnniversaryToggle}
            />
          </>
        )}
        {note ? <Text style={styles.note}>{note}</Text> : null}
      </View>
    </View>
  );
}

function ArmToggle({
  label,
  enabled,
  disabled,
  onToggle,
}: {
  label: string;
  enabled: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={`Auto-send ${label.toLowerCase()} card`}
      accessibilityState={{ checked: enabled, disabled }}
      disabled={disabled}
      onPress={onToggle}
      style={[styles.armRow, disabled && styles.armRowDisabled]}
    >
      <Text style={styles.armLabel}>{label}</Text>
      <View style={[styles.toggle, enabled && styles.toggleOn]}>
        <View style={[styles.toggleKnob, enabled && styles.toggleKnobOn]} />
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
  open: {
    gap: spacing.md,
  },
  pressed: {
    opacity: 0.85,
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
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
  },
  tagLabel: {
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
  occasion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
  },
  occasionHeadline: {
    flex: 1,
    fontSize: typography.sizeSm,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
  },
  autoSend: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  autoSendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    minHeight: 32,
  },
  autoSendTitle: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
  },
  autoSendArmed: {
    flexShrink: 1,
    fontSize: typography.sizeSm,
    color: colors.inkSoft,
  },
  quickArm: {
    minHeight: 44,
    marginTop: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.accentHover,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickArmLabel: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightSemibold,
    color: colors.white,
  },
  armRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  armRowDisabled: {
    opacity: 0.55,
  },
  armLabel: {
    fontSize: typography.sizeSm,
    color: colors.ink,
  },
  note: {
    marginTop: spacing.xs,
    fontSize: typography.sizeSm,
    lineHeight: typography.sizeSm * 1.4,
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
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: radius.full,
    backgroundColor: colors.white,
  },
  toggleKnobOn: {
    alignSelf: 'flex-end',
  },
});
