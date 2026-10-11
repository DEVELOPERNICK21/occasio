import { Pressable, StyleSheet, View } from 'react-native';
import { ChevronRight, Ellipsis } from 'lucide-react-native';
import { Text } from '../../../../shared/ui/Text';
import { colors, radius, spacing, typography } from '../../../../shared/theme/tokens';
import type { VaultCardTheme } from '../../domain/vaultCardTheme';
import { personInitials } from '../../domain/vaultCardTheme';
import { formatArmedOccasions, type PersonNextOccasion } from '../../domain/vaultOccasion';
import type { VaultPerson } from '../../domain/types';

type Props = {
  person: VaultPerson;
  theme: VaultCardTheme;
  occasion: PersonNextOccasion;
  autoSendBirthday: boolean;
  autoSendAnniversary: boolean;
  onOpen: () => void;
  onMenu: () => void;
};

const MENU_SIZE = 44;

/** One-line person for occasions that are not close yet. */
export function VaultPersonRow({
  person,
  theme,
  occasion,
  autoSendBirthday,
  autoSendAnniversary,
  onOpen,
  onMenu,
}: Props) {
  const anyArmed = autoSendBirthday || autoSendAnniversary;
  const detail = anyArmed
    ? `${occasion.headline} · Auto-send ${formatArmedOccasions({
        autoSendBirthday,
        autoSendAnniversary,
      }).toLowerCase()}`
    : occasion.headline;

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${person.personName}, ${theme.tagLabel}. ${detail}`}
        accessibilityHint="Opens this person"
        onPress={onOpen}
        style={({ pressed }) => [styles.open, pressed && styles.pressed]}
      >
        <View style={[styles.avatar, { backgroundColor: theme.softBackground }]}>
          <Text style={styles.avatarText}>{personInitials(person.personName)}</Text>
        </View>
        <View style={styles.copy}>
          <Text style={styles.name} numberOfLines={1}>
            {person.personName}
          </Text>
          <Text style={styles.detail} numberOfLines={1}>
            {detail}
          </Text>
        </View>
        <ChevronRight size={16} color={colors.muted} strokeWidth={2} absoluteStrokeWidth />
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
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingLeft: spacing.md,
  },
  open: {
    flex: 1,
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  pressed: {
    opacity: 0.85,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
  },
  copy: {
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
  detail: {
    fontSize: typography.sizeSm,
    color: colors.inkSoft,
  },
  menu: {
    width: MENU_SIZE,
    height: MENU_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
