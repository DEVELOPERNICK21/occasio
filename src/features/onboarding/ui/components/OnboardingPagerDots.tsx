import { StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '../../../../shared/theme/tokens';

type Props = {
  count: number;
  activeIndex: number;
};

export function OnboardingPagerDots({ count, activeIndex }: Props) {
  return (
    <View
      style={styles.row}
      accessibilityRole="tablist"
      accessibilityLabel={`Slide ${activeIndex + 1} of ${count}`}
    >
      {Array.from({ length: count }, (_, index) => {
        const active = index === activeIndex;
        return (
          <View
            key={index}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={[styles.dot, active && styles.dotActive]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  dot: {
    width: 24,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.border,
  },
  dotActive: {
    backgroundColor: colors.accent,
  },
});
