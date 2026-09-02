import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Text } from '../../../../shared/ui/Text';
import { colors, spacing, typography } from '../../../../shared/theme/tokens';

type Props = {
  text: string;
  slideKey: number;
};

/** Calm reassurance below the CTA — transparency, not pressure. */
export function OnboardingTrustStrip({ text, slideKey }: Props) {
  return (
    <View style={styles.root}>
      <Animated.View
        key={`trust-${slideKey}`}
        entering={FadeIn.duration(320).delay(80)}
        exiting={FadeOut.duration(180)}
      >
        <Text style={styles.text}>{text}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    minHeight: typography.sizeXs * 1.5,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: typography.sizeXs,
    lineHeight: typography.sizeXs * 1.5,
    color: colors.muted,
    textAlign: 'center',
  },
});
