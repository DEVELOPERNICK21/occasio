import { Flower2, Landmark, Leaf, type LucideIcon } from '../../../../shared/ui/icons/lucide';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../../../shared/theme/tokens';
import { Text } from '../../../../shared/ui/Text';
import { DESIGN_INFO, type InvitationDesign, type InvitationOccasion } from '../../domain/invitation';
import { InviteExampleLink } from './InviteExampleLink';

/** A hint of each design's colours and mood, from the app's own palette: the real thing is in the example. */
const SWATCH: Record<InvitationDesign, { wash: string; dots: readonly [string, string, string]; Icon: LucideIcon }> = {
  regal: { wash: colors.butterSoft, dots: [colors.sage, colors.butter, colors.secondary], Icon: Flower2 },
  sage: { wash: colors.sageSoft, dots: [colors.sage, colors.butter, colors.surface], Icon: Leaf },
  palace: { wash: colors.roseSoft, dots: [colors.rose, colors.tertiary, colors.white], Icon: Landmark },
};

type Props = {
  design: InvitationDesign;
  occasion: InvitationOccasion;
  selected: boolean;
  onSelect: () => void;
};

/** One of the designs to choose from: what it looks like, what it does on opening, and a way to try it. */
export function InviteDesignCard({ design, occasion, selected, onSelect }: Props) {
  const info = DESIGN_INFO[design];
  const { wash, dots, Icon } = SWATCH[design];
  return (
    <View style={[styles.card, selected && styles.cardOn]}>
      <Pressable
        accessibilityRole="radio"
        accessibilityState={{ selected }}
        accessibilityLabel={`${info.label}. ${info.blurb} ${info.entrance}`}
        onPress={onSelect}
        style={({ pressed }) => [styles.pick, pressed && styles.pressed]}
      >
        <View style={[styles.swatch, { backgroundColor: wash }]}>
          <Icon size={26} color={colors.accentHover} strokeWidth={1.8} absoluteStrokeWidth />
          <View style={styles.dots}>
            {dots.map((dot, i) => (
              <View key={i} style={[styles.dot, { backgroundColor: dot }]} />
            ))}
          </View>
        </View>
        <View style={styles.copy}>
          <Text style={styles.label}>{info.label}</Text>
          <Text style={styles.blurb}>{info.blurb}</Text>
          <Text style={styles.entrance}>{info.entrance}</Text>
        </View>
        <View style={[styles.radio, selected && styles.radioOn]}>
          {selected ? <View style={styles.radioDot} /> : null}
        </View>
      </Pressable>
      <View style={styles.example}>
        <InviteExampleLink occasion={occasion} design={design} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  cardOn: {
    borderColor: colors.accent,
    borderWidth: 2,
    backgroundColor: colors.sidebar,
  },
  pick: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  pressed: {
    opacity: 0.85,
  },
  swatch: {
    width: 76,
    height: 96,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  dots: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
  },
  blurb: {
    fontSize: typography.sizeSm,
    lineHeight: typography.sizeSm * 1.4,
    color: colors.inkSoft,
  },
  entrance: {
    marginTop: spacing.xs,
    fontSize: typography.sizeXs,
    lineHeight: typography.sizeXs * 1.4,
    color: colors.muted,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: {
    borderColor: colors.accent,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
  },
  example: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xs,
  },
});
