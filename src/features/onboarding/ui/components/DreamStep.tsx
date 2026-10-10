import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { triggerCardHaptic, triggerSuccessHaptic } from '../../../../shared/platform/haptics';
import { Text } from '../../../../shared/ui/Text';
import { colors, radius, shadow, spacing, typography } from '../../../../shared/theme/tokens';
import { occasionHeadline, occasionToTemplateType } from '../../../create/domain/audienceOccasion';
import type { Audience, Occasion } from '../../../create/domain/templateSchema';
import { getTemplateTheme } from '../../../create/domain/templateTheme';
import {
  DREAM_OPENED_LINE,
  GIFT_OPENED_CAPTION,
  recipientLine,
} from '../../domain/onboardingFlow';
import { HEADLINE_FONT } from '../onboardingStyle';
import { GiftTicket, PipStage } from './PipStage';

type Props = {
  audience: Audience | null;
  occasion: Occasion | null;
  onOpen: () => void;
};

/** The card Pip hands over once the gift is open, in the occasion's own colours. */
function OpenedCard({ audience, occasion }: Pick<Props, 'audience' | 'occasion'>) {
  const theme = getTemplateTheme(occasionToTemplateType(occasion ?? 'birthday'));
  return (
    <Animated.View
      entering={FadeIn.duration(360)}
      style={[styles.card, { backgroundColor: theme.softBackground, borderColor: theme.orbPrimary }]}
    >
      <Text style={[styles.kicker, { color: theme.accent }]} numberOfLines={1}>
        {theme.kicker}
      </Text>
      <Text style={styles.headline} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
        {occasionHeadline(occasion) ?? 'Happy Birthday'}
      </Text>
      <Text style={styles.line} numberOfLines={1}>
        {recipientLine(audience)}
      </Text>
    </Animated.View>
  );
}

/**
 * The dream. The person opens the gift and Pip jumps for joy: they feel what
 * their person will feel. One tap, one payoff, and a haptic to seal it.
 */
export function DreamStep({ audience, occasion, onOpen }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const toggle = () => {
    if (isOpen) {
      setIsOpen(false);
      triggerCardHaptic();
      return;
    }
    setIsOpen(true);
    triggerSuccessHaptic();
    onOpen();
  };

  return (
    <View style={styles.root}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={isOpen ? 'Close the gift' : 'Open the gift'}
        onPress={toggle}
        style={styles.press}
      >
        <PipStage
          mood={isOpen ? 'joy' : 'hopeful'}
          holdsGift={!isOpen}
          top={
            <View style={styles.topSlot}>
              {isOpen ? <OpenedCard audience={audience} occasion={occasion} /> : <GiftTicket audience={audience} />}
            </View>
          }
          confetti={isOpen}
        />
      </Pressable>

      <View style={styles.captionSlot}>
        {isOpen ? (
          <Animated.View entering={FadeIn.duration(360).delay(120)} style={styles.captionBox}>
            <Text style={styles.dream}>{DREAM_OPENED_LINE}</Text>
            <Text style={styles.caption}>{GIFT_OPENED_CAPTION}</Text>
          </Animated.View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'center', gap: spacing.md },
  press: { alignSelf: 'stretch', alignItems: 'center' },
  // Both states take the same room, so the hero does not shift when the gift opens.
  topSlot: { minHeight: 96, alignItems: 'center', justifyContent: 'center' },
  captionSlot: { minHeight: 116, alignSelf: 'stretch' },
  card: {
    width: 220,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    alignItems: 'center',
    gap: 2,
    ...shadow.card,
  },
  kicker: { fontSize: 11, fontWeight: typography.weightSemibold, letterSpacing: 0.4 },
  headline: {
    fontSize: typography.sizeXl,
    lineHeight: typography.sizeXl * 1.15,
    fontFamily: HEADLINE_FONT,
    fontWeight: '700',
    color: colors.ink,
  },
  line: { fontSize: typography.sizeSm, color: colors.inkSoft, fontWeight: typography.weightMedium },
  captionBox: { alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.sm },
  dream: {
    fontSize: typography.sizeMd,
    lineHeight: typography.sizeMd * 1.4,
    color: colors.ink,
    textAlign: 'center',
    fontWeight: typography.weightMedium,
  },
  caption: {
    fontSize: typography.sizeSm,
    lineHeight: typography.sizeSm * 1.45,
    color: colors.inkSoft,
    textAlign: 'center',
  },
});
