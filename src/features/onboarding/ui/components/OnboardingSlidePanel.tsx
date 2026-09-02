import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Text } from '../../../../shared/ui/Text';
import { colors, spacing, typography } from '../../../../shared/theme/tokens';
import type { OnboardingSlide } from '../../domain/onboardingSlides';
import { OnboardingOutcomeLine } from './OnboardingOutcomeLine';

type Props = {
  slide: OnboardingSlide;
  isActive: boolean;
  replayKey: number;
};

export function OnboardingSlidePanel({ slide, isActive, replayKey }: Props) {
  if (!isActive) {
    return (
      <View style={styles.root}>
        <Text style={styles.eyebrow}>{slide.eyebrow}</Text>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.body}>{slide.body}</Text>
        <OnboardingOutcomeLine text={slide.outcome} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Animated.View
        key={`eyebrow-${replayKey}`}
        entering={FadeInUp.duration(380).delay(80)}
      >
        <Text style={styles.eyebrow}>{slide.eyebrow}</Text>
      </Animated.View>
      <Animated.View
        key={`title-${replayKey}`}
        entering={FadeInDown.duration(460).delay(140)}
      >
        <Text style={styles.title}>{slide.title}</Text>
      </Animated.View>
      <Animated.View
        key={`body-${replayKey}`}
        entering={FadeInDown.duration(460).delay(220)}
      >
        <Text style={styles.body}>{slide.body}</Text>
      </Animated.View>
      <Animated.View
        key={`outcome-${replayKey}`}
        entering={FadeInDown.duration(420).delay(300)}
      >
        <OnboardingOutcomeLine text={slide.outcome} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  eyebrow: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightSemibold,
    color: colors.accent,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: typography.size2xl,
    lineHeight: typography.size2xl * 1.12,
    letterSpacing: -0.6,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  body: {
    fontSize: typography.sizeMd,
    lineHeight: typography.sizeMd * 1.45,
    color: colors.inkSoft,
    maxWidth: 340,
  },
});
