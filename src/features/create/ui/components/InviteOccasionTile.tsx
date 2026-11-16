import {
  Baby,
  Cake,
  GraduationCap,
  Heart,
  House,
  PartyPopper,
  Sparkles,
  Gem,
  type LucideIcon,
} from '../../../../shared/ui/icons/lucide';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../../../shared/theme/tokens';
import { Text } from '../../../../shared/ui/Text';
import { OCCASION_INFO, type InvitationOccasion } from '../../domain/invitation';

const ICONS: Record<InvitationOccasion, LucideIcon> = {
  wedding: Heart,
  engagement: Gem,
  anniversary: Sparkles,
  birthday: Cake,
  baby_shower: Baby,
  housewarming: House,
  graduation: GraduationCap,
  party: PartyPopper,
};

/** The soft background behind each icon, from the app's celebration colours. */
const WASH: Record<InvitationOccasion, string> = {
  wedding: colors.roseSoft,
  engagement: colors.amberSoft,
  anniversary: colors.roseSoft,
  birthday: colors.butterSoft,
  baby_shower: colors.sageSoft,
  housewarming: colors.amberSoft,
  graduation: colors.sageSoft,
  party: colors.butterSoft,
};

type Props = {
  occasion: InvitationOccasion;
  onPress: () => void;
};

/** One kind of invitation on the home screen: an icon, its name and one line about it. */
export function InviteOccasionTile({ occasion, onPress }: Props) {
  const info = OCCASION_INFO[occasion];
  const Icon = ICONS[occasion];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${info.label} invitation. ${info.blurb}`}
      onPress={onPress}
      style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
    >
      <View style={[styles.icon, { backgroundColor: WASH[occasion] }]}>
        <Icon size={22} color={colors.accentHover} strokeWidth={2} absoluteStrokeWidth />
      </View>
      <Text style={styles.label}>{info.label}</Text>
      <Text style={styles.blurb} numberOfLines={3}>
        {info.blurb}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flexGrow: 1,
    flexBasis: '47%',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pressed: {
    opacity: 0.85,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
  },
  blurb: {
    fontSize: typography.sizeSm,
    lineHeight: typography.sizeSm * 1.4,
    color: colors.muted,
  },
});
