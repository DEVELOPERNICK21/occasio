import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Text } from '../../../../shared/ui/Text';
import { CardWashBackground } from '../../../../shared/ui/CardWashBackground';
import type { TemplateTheme } from '../../domain/templateTheme';
import type { TemplateOption } from '../../domain/templates';
import { colors, radius, shadow, spacing, typography } from '../../../../shared/theme/tokens';

const PRESS_SPRING = { damping: 20, stiffness: 520, mass: 0.6 };

type Props = {
  template: TemplateOption;
  theme: TemplateTheme;
  onPress: () => void;
};

export function TemplateOptionCard({ template, theme, onPress }: Props) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, PRESS_SPRING);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, PRESS_SPRING);
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${template.label}. ${theme.emotionalCue}`}
      accessibilityHint="Opens photo picker for this occasion"
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      android_ripple={{ color: theme.softBackground, borderless: false }}
      style={styles.pressable}
    >
      {({ pressed }) => (
        <View style={styles.shadowShell}>
          <Animated.View
            style={[
              styles.card,
              animatedStyle,
              {
                backgroundColor: pressed ? theme.softBackground : colors.surface,
                borderColor: pressed ? theme.accent : colors.border,
              },
            ]}
          >
            <CardWashBackground
              variant={template.id}
              primary={theme.orbPrimary}
              secondary={theme.orbSecondary}
            />

            <View style={styles.body}>
              <View style={styles.iconStage}>
                <View
                  style={[styles.iconOrb, { backgroundColor: theme.orbPrimary }]}
                  pointerEvents="none"
                />
                <View
                  style={[
                    styles.iconWrap,
                    {
                      backgroundColor: theme.softBackground,
                      borderColor: theme.accentSecondary,
                    },
                  ]}
                >
                  <Text
                    style={styles.emoji}
                    accessibilityElementsHidden
                    importantForAccessibility="no"
                  >
                    {template.emoji}
                  </Text>
                </View>
              </View>

              <Text style={styles.cardLabel} numberOfLines={1}>
                {template.label}
              </Text>
              <Text style={[styles.emotionalCue, { color: theme.accent }]} numberOfLines={1}>
                {theme.emotionalCue}
              </Text>
            </View>
          </Animated.View>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    width: '48%',
  },
  shadowShell: {
    borderRadius: radius.lg,
    ...shadow.card,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  card: {
    minHeight: 112,
    borderWidth: 1,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  body: {
    flex: 1,
    zIndex: 1,
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
    paddingTop: spacing.sm,
    gap: 2,
  },
  iconStage: {
    width: 48,
    height: 48,
    marginBottom: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconOrb: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    opacity: 0.35,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 24,
    lineHeight: 28,
  },
  cardLabel: {
    fontSize: typography.sizeSm,
    lineHeight: typography.sizeSm * 1.25,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
  },
  emotionalCue: {
    fontSize: typography.sizeXs,
    lineHeight: typography.sizeXs * 1.4,
    fontWeight: typography.weightMedium,
  },
});
