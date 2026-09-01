import { StyleSheet, View } from 'react-native';
import { Text } from '../../../../shared/ui/Text';
import { colors, radius, spacing, typography } from '../../../../shared/theme/tokens';
import type { OnboardingSlideId } from '../../domain/onboardingSlides';

type Props = {
  slideId: OnboardingSlideId;
};

export function OnboardingSlideVisual({ slideId }: Props) {
  if (slideId === 'create') {
    return (
      <View style={styles.frame}>
        <View style={styles.chipRow}>
          {['Birthday', 'Anniversary', 'Thank you'].map((label) => (
            <View
              key={label}
              style={[styles.chip, label === 'Birthday' && styles.chipSelected]}
            >
              <Text
                style={[
                  styles.chipLabel,
                  label === 'Birthday' && styles.chipLabelSelected,
                ]}
              >
                {label}
              </Text>
            </View>
          ))}
        </View>
        <View style={styles.photoSlot}>
          <Text style={styles.photoHint}>Add a photo</Text>
        </View>
        <View style={styles.messageLine} />
        <View style={[styles.messageLine, styles.messageLineShort]} />
      </View>
    );
  }

  if (slideId === 'share') {
    return (
      <View style={styles.shareOffset}>
        <View style={styles.wishCard}>
          <View style={styles.wishAccent} />
          <Text style={styles.wishEyebrow}>For Alex</Text>
          <Text style={styles.wishMessage}>
            Wishing you a day as warm as you are.
          </Text>
          <View style={styles.wishPhoto} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.frame}>
      {[
        { name: 'Alex', occasion: 'Birthday · Mar 12' },
        { name: 'Sam', occasion: 'Anniversary · Jun 3' },
      ].map((person) => (
        <View key={person.name} style={styles.vaultRow}>
          <View style={styles.vaultAvatar} />
          <View style={styles.vaultCopy}>
            <Text style={styles.vaultName}>{person.name}</Text>
            <Text style={styles.vaultMeta}>{person.occasion}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: '100%',
    maxWidth: 320,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    gap: spacing.md,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  chipSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.sidebar,
  },
  chipLabel: {
    fontSize: typography.sizeSm,
    color: colors.muted,
  },
  chipLabelSelected: {
    color: colors.ink,
    fontWeight: typography.weightMedium,
  },
  photoSlot: {
    height: 140,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
  photoHint: {
    fontSize: typography.sizeSm,
    color: colors.muted,
  },
  messageLine: {
    height: 10,
    borderRadius: radius.sm,
    backgroundColor: colors.border,
    opacity: 0.55,
  },
  messageLineShort: {
    width: '68%',
  },
  shareOffset: {
    width: '100%',
    maxWidth: 320,
    paddingLeft: spacing.lg,
  },
  wishCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  wishAccent: {
    width: 32,
    height: 3,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
  },
  wishEyebrow: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightMedium,
    color: colors.ink,
  },
  wishMessage: {
    fontSize: typography.sizeMd,
    lineHeight: typography.sizeMd * 1.4,
    color: colors.inkSoft,
  },
  wishPhoto: {
    marginTop: spacing.sm,
    height: 120,
    borderRadius: radius.md,
    backgroundColor: colors.sidebar,
    borderWidth: 1,
    borderColor: colors.border,
  },
  vaultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  vaultAvatar: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.sidebar,
    borderWidth: 1,
    borderColor: colors.border,
  },
  vaultCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  vaultName: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightMedium,
    color: colors.ink,
  },
  vaultMeta: {
    fontSize: typography.sizeSm,
    color: colors.muted,
  },
});
