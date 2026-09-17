import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Text } from '../../../../shared/ui/Text';
import { CardWashBackground } from '../../../../shared/ui/CardWashBackground';
import { colors, radius, shadow, spacing, typography } from '../../../../shared/theme/tokens';
import type { TemplateTheme } from '../../domain/templateTheme';
import type { TemplateType } from '../../domain/types';
import { TemplateOccasionIcon } from './TemplateOccasionIcon';

const PRESS_SPRING = { damping: 20, stiffness: 520, mass: 0.6 };

type Props = {
  occasion: TemplateType;
  label: string;
  cue: string;
  theme: TemplateTheme;
  selected?: boolean;
  onPress: () => void;
};

export function OccasionCard({
  occasion,
  label,
  cue,
  theme,
  selected = false,
  onPress,
}: Props) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}. ${cue}`}
      accessibilityState={{ selected }}
      accessibilityHint="Continues to add photos"
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.98, PRESS_SPRING);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, PRESS_SPRING);
      }}
      android_ripple={{ color: theme.softBackground, borderless: false }}
    >
      <View style={styles.shadowShell}>
        <Animated.View
          style={[
            styles.card,
            animatedStyle,
            selected && {
              borderColor: theme.accent,
              backgroundColor: theme.softBackground,
            },
          ]}
        >
          <CardWashBackground
            variant={occasion === 'sorry' || occasion === 'proposal' ? 'upcoming' : occasion}
            primary={theme.orbPrimary}
            secondary={theme.orbSecondary}
          />
          <View style={styles.row}>
            <View
              style={[
                styles.iconWrap,
                {
                  backgroundColor: theme.softBackground,
                  borderColor: theme.accentSecondary,
                },
              ]}
            >
              <TemplateOccasionIcon
                templateType={occasion}
                size={20}
                color={theme.accent}
              />
            </View>
            <View style={styles.copy}>
              <Text style={styles.label} numberOfLines={1}>
                {label}
              </Text>
              <Text style={styles.cue} numberOfLines={1}>
                {cue}
              </Text>
            </View>
          </View>
        </Animated.View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  shadowShell: {
    borderRadius: radius.lg,
    ...shadow.card,
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 2,
  },
  card: {
    minHeight: 76,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  row: {
    zIndex: 1,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  label: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
    letterSpacing: -0.2,
  },
  cue: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightMedium,
    lineHeight: typography.sizeXs * 1.35,
    color: colors.inkSoft,
  },
});
