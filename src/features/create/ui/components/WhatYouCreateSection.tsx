import { StyleSheet, View } from 'react-native';
import { Camera, Link2, PenLine } from 'lucide-react-native';
import { Text } from '../../../../shared/ui/Text';
import { colors, radius, spacing, typography } from '../../../../shared/theme/tokens';

const PILLARS = [
  {
    Icon: Camera,
    title: 'A photo that feels like you',
    body: 'Their face, your moment — cropped for a beautiful card.',
  },
  {
    Icon: PenLine,
    title: 'Words only you would write',
    body: 'A few honest lines land better than a long message.',
  },
  {
    Icon: Link2,
    title: 'A link they can open anywhere',
    body: 'No app install. WhatsApp, SMS, or email — it just works.',
  },
] as const;

/** Emotional framing — what the sender actually makes. */
export function WhatYouCreateSection() {
  return (
    <View style={styles.wrap}>
      <View style={[styles.orb, styles.orbA]} pointerEvents="none" />
      <View style={[styles.orb, styles.orbB]} pointerEvents="none" />

      <Text style={styles.eyebrow}>What you create</Text>
      <Text style={styles.title}>Something personal they will keep</Text>
      <Text style={styles.intro}>
        Not a generic e-card — a real photo, your message, and a link that opens on any phone.
      </Text>

      <View style={styles.list}>
        {PILLARS.map(({ Icon, title, body }) => (
          <View key={title} style={styles.row}>
            <View style={styles.iconWrap}>
              <Icon size={18} color={colors.accent} strokeWidth={2} absoluteStrokeWidth />
            </View>
            <View style={styles.copy}>
              <Text style={styles.rowTitle}>{title}</Text>
              <Text style={styles.rowBody}>{body}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    gap: spacing.xs,
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.35,
  },
  orbA: {
    top: -28,
    right: -20,
    width: 88,
    height: 88,
    backgroundColor: colors.accentSoft,
  },
  orbB: {
    bottom: -24,
    left: -16,
    width: 64,
    height: 64,
    backgroundColor: colors.secondary,
    opacity: 0.2,
  },
  eyebrow: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightSemibold,
    color: colors.accent,
  },
  title: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
    letterSpacing: -0.2,
  },
  intro: {
    fontSize: typography.sizeSm,
    lineHeight: typography.sizeSm * 1.45,
    color: colors.inkSoft,
    marginBottom: spacing.xs,
  },
  list: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.sidebar,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
  },
  rowBody: {
    fontSize: typography.sizeXs,
    lineHeight: typography.sizeXs * 1.45,
    color: colors.muted,
  },
});
