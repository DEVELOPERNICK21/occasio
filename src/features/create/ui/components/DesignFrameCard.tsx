import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { colors, radius, shadow, spacing, typography } from '../../../../shared/theme/tokens';
import { Text } from '../../../../shared/ui/Text';
import type { TemplateDefinition } from '../../domain/templateSchema';
import { DesignFramePreview } from './DesignFramePreview';

const PRESS_SPRING = { damping: 20, stiffness: 520, mass: 0.6 };

type Tone = {
  wash: string;
  photo: string;
  photoAlt: string;
  accent: string;
  ink: string;
};

type Props = {
  template: TemplateDefinition;
  cue: string;
  headline: string;
  photoUris: string[];
  tone: Tone;
  width: number;
  recommended?: boolean;
  onPress: () => void;
};

const STYLE_LABELS: Record<TemplateDefinition['style'], string> = {
  elegant: 'Elegant',
  emotional: 'Warm',
  minimal: 'Quiet',
};

export function DesignFrameCard({
  template,
  cue,
  headline,
  photoUris,
  tone,
  width,
  recommended = false,
  onPress,
}: Props) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${template.title}. ${cue}`}
      accessibilityHint="Continues to add photos for this design"
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.97, PRESS_SPRING);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, PRESS_SPRING);
      }}
      style={{ width }}
    >
      <View style={styles.shadowShell}>
        <Animated.View style={[styles.card, animatedStyle]}>
          <DesignFramePreview
            layoutId={template.layoutId}
            title={headline}
            tone={tone}
            photoUris={photoUris}
          />
          <View style={styles.meta}>
            <View style={styles.titleRow}>
              <Text style={styles.title} numberOfLines={1}>
                {template.title}
              </Text>
              {recommended ? (
                <Text style={[styles.badge, { color: tone.accent }]}>
                  Best match
                </Text>
              ) : null}
            </View>
            <Text style={styles.cue} numberOfLines={1}>
              {cue}
            </Text>
            <Text style={styles.detail} numberOfLines={1}>
              {STYLE_LABELS[template.style]} ·{' '}
              {template.photoSlots === 1 ? '1 photo' : `${template.photoSlots} photos`}
            </Text>
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
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 3,
  },
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  meta: {
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  cue: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightMedium,
    color: colors.inkSoft,
  },
  title: {
    flexShrink: 1,
    fontSize: typography.sizeSm,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
  },
  badge: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightSemibold,
  },
  detail: {
    marginTop: 2,
    fontSize: typography.sizeXs,
    color: colors.muted,
  },
});
