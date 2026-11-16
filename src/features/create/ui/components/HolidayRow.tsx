import { Pressable, StyleSheet, View } from 'react-native';
import { ChevronRight } from '../../../../shared/ui/icons/lucide';
import { Text } from '../../../../shared/ui/Text';
import { colors, radius, spacing, typography } from '../../../../shared/theme/tokens';
import type { Holiday } from '../../domain/holidays';
import { getTemplateTheme } from '../../domain/templateTheme';
import { FestivalArt } from '../../../../shared/ui/art/FestivalArt';
import { festivalArtFor } from '../../domain/festivalArt';
import { TemplateOccasionIcon } from './TemplateOccasionIcon';

type Props = {
  holiday: Holiday;
  /** The line under the name: the one-line cue, or the date. */
  detail: string;
  /** "In 12 days". Left out when the day is far off or not known. */
  chip?: string;
  /** Soon enough to stand out. */
  soon?: boolean;
  onPress: () => void;
};

/** One festival: its icon in its own colours, its name, and when it is. Tap to make a wish. */
export function HolidayRow({ holiday, detail, chip, soon = false, onPress }: Props) {
  const theme = getTemplateTheme(holiday.id);
  const label = [holiday.label, detail, chip].filter(Boolean).join('. ');
  const art = festivalArtFor(holiday.id);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint="Starts a card for this festival"
      onPress={onPress}
      android_ripple={{ color: theme.softBackground, borderless: false }}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View
        style={[
          styles.icon,
          { backgroundColor: theme.softBackground, borderColor: theme.accentSecondary },
        ]}
      >
        {art ? (
          <FestivalArt motif={art.hero} size={32} />
        ) : (
          <TemplateOccasionIcon templateType={holiday.id} size={20} color={theme.accent} />
        )}
      </View>
      <View style={styles.copy}>
        <Text style={styles.name} numberOfLines={1}>
          {holiday.label}
        </Text>
        <Text style={styles.detail} numberOfLines={2}>
          {detail}
        </Text>
      </View>
      {chip ? (
        <View
          style={[
            styles.chip,
            soon ? { backgroundColor: theme.accent } : { backgroundColor: theme.softBackground },
          ]}
        >
          <Text style={[styles.chipText, { color: soon ? colors.white : theme.accent }]}>{chip}</Text>
        </View>
      ) : (
        <ChevronRight size={18} color={colors.muted} strokeWidth={2} absoluteStrokeWidth />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 64,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
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
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  name: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
    letterSpacing: -0.2,
  },
  detail: {
    fontSize: typography.sizeXs,
    lineHeight: typography.sizeXs * 1.4,
    color: colors.inkSoft,
  },
  chip: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  chipText: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightSemibold,
  },
});
