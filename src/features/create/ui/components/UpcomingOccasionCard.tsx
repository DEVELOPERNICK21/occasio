import { Cake } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../../../../shared/ui/Text';
import { CardWashBackground } from '../../../../shared/ui/CardWashBackground';
import type { UpcomingOccasion } from '../../domain/createHome';
import { formatOccasionCountdown } from '../../domain/createHome';
import { colors, radius, shadow, spacing, typography } from '../../../../shared/theme/tokens';

type Props = {
  occasion: UpcomingOccasion;
  accentColor: string;
  softBackground: string;
  onSendCard: () => void;
  onOpenVault: () => void;
};

export function UpcomingOccasionCard({
  occasion,
  accentColor,
  softBackground,
  onSendCard,
  onOpenVault,
}: Props) {
  return (
    <View style={styles.shadowShell}>
      <View style={styles.card}>
        <CardWashBackground
          variant="upcoming"
          primary={accentColor}
          secondary={softBackground}
        />
        <View style={styles.body}>
          <View style={styles.header}>
            <View style={[styles.iconWrap, { backgroundColor: softBackground }]}>
              <Cake
                size={18}
                color={accentColor}
                strokeWidth={2}
                absoluteStrokeWidth
              />
            </View>
            <View style={styles.headerCopy}>
              <Text style={styles.title} numberOfLines={1}>
                {occasion.label}
              </Text>
              <Text style={styles.meta} numberOfLines={1}>
                {occasion.relationshipLabel}
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: softBackground }]}>
              <Text style={[styles.badgeText, { color: accentColor }]}>
                {formatOccasionCountdown(occasion.daysUntil)}
              </Text>
            </View>
          </View>

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Send card for ${occasion.personName}`}
              onPress={onSendCard}
              style={({ pressed }) => [
                styles.action,
                { backgroundColor: softBackground },
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.actionLabel, { color: accentColor }]}>Send card</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Open Vault for ${occasion.personName}`}
              onPress={onOpenVault}
              style={({ pressed }) => [
                styles.action,
                styles.actionSecondary,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.actionSecondaryLabel}>Open Vault</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadowShell: {
    borderRadius: radius.lg,
    ...shadow.card,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  body: {
    zIndex: 1,
    padding: spacing.sm,
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  title: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
  },
  meta: {
    fontSize: typography.sizeXs,
    color: colors.muted,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  badgeText: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightSemibold,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  action: {
    flex: 1,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
  },
  actionSecondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: {
    opacity: 0.88,
  },
  actionLabel: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightSemibold,
  },
  actionSecondaryLabel: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
  },
});
