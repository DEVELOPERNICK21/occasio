import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../../../../shared/ui/Text';
import { colors, radius, spacing, typography } from '../../../../shared/theme/tokens';
import { profileInitials } from '../../domain/accountProfile';
import type { AuthUser } from '../../domain/types';
import { formatAuthIdentity } from '../../domain/mapUser';

type Props = {
  user: AuthUser;
};

export function AccountTopBar({ user }: Props) {
  const initials = profileInitials(user);

  return (
    <View style={styles.root}>
      <Pressable accessibilityRole="button" accessibilityLabel="Menu" hitSlop={8}>
        <Text style={styles.menu}>☰</Text>
      </Pressable>
      <Text style={styles.brand}>OCCASIO</Text>
      <View style={styles.avatarMini}>
        <Text style={styles.avatarMiniText}>{initials}</Text>
      </View>
    </View>
  );
}

export function AccountProfileHero({ user }: Props) {
  const initials = profileInitials(user);
  const name = formatAuthIdentity(user);

  return (
    <View style={styles.hero}>
      <View style={styles.photoWrap}>
        <View style={styles.photo}>
          <Text style={styles.photoText}>{initials}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Edit profile photo"
          style={styles.editBadge}
        >
          <Text style={styles.editIcon}>✎</Text>
        </Pressable>
      </View>
      <Text style={styles.name}>{name}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  menu: {
    fontSize: typography.sizeLg,
    color: colors.ink,
    width: 32,
  },
  brand: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightSemibold,
    letterSpacing: 2,
    color: colors.ink,
  },
  avatarMini: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.sidebar,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatarMiniText: {
    fontSize: 10,
    fontWeight: typography.weightSemibold,
    color: colors.accent,
  },
  hero: {
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  photoWrap: {
    position: 'relative',
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: radius.xl,
    backgroundColor: colors.sidebar,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoText: {
    fontSize: typography.size2xl,
    fontWeight: typography.weightSemibold,
    color: colors.accent,
  },
  editBadge: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.bg,
  },
  editIcon: {
    fontSize: 14,
    color: colors.white,
    lineHeight: 16,
  },
  name: {
    fontSize: typography.size2xl,
    lineHeight: typography.size2xl * 1.1,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
});
