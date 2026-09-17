import { Cake } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../../../../shared/ui/Text';
import { CardWashBackground } from '../../../../shared/ui/CardWashBackground';
import type { UpcomingOccasion } from '../../domain/createHome';
import {
  formatOccasionCountdown,
  upcomingOccasionPrompt,
} from '../../domain/createHome';
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
  const prompt = upcomingOccasionPrompt(occasion.personName, occasion.daysUntil);
  const isSoon = occasion.daysUntil <= 7;

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
                size={20}
                color={accentColor}
                strokeWidth={2}
                absoluteStrokeWidth
              />
            </View>
            <View style={styles.headerCopy}>
              <Text style={styles.name} numberOfLines={1}>
                {occasion.personName}
              </Text>
              <Text style={styles.meta} numberOfLines={1}>
                Birthday · {occasion.relationshipLabel}
              </Text>
            </View>
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: isSoon ? accentColor : softBackground,
                },
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  { color: isSoon ? colors.white : accentColor },
                ]}
              >
                {formatOccasionCountdown(occasion.daysUntil)}
              </Text>
            </View>
          </View>

          <Text style={styles.prompt}>{prompt}</Text>

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Send card for ${occasion.personName}`}
              onPress={onSendCard}
              style={({ pressed }) => [
                styles.actionPrimary,
                { backgroundColor: accentColor },
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.actionPrimaryLabel}>Send a card</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Open Vault for ${occasion.personName}`}
              onPress={onOpenVault}
              style={({ pressed }) => [
                styles.actionSecondary,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.actionSecondaryLabel}>Vault</Text>
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
    shadowOpacity: 0.08,
    shadowRadius: 14,
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
    padding: spacing.md,
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: {
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
  meta: {
    fontSize: typography.sizeXs,
    color: colors.muted,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  badgeText: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightSemibold,
  },
  prompt: {
    fontSize: typography.sizeSm,
    lineHeight: typography.sizeSm * 1.45,
    color: colors.inkSoft,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  actionPrimary: {
    flex: 1.4,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
  },
  actionSecondary: {
    flex: 0.8,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: {
    opacity: 0.88,
  },
  actionPrimaryLabel: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightSemibold,
    color: colors.white,
  },
  actionSecondaryLabel: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
  },
});
