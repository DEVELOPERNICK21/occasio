import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Pip, type PipMood } from '../../../../shared/ui/Pip';
import { Text } from '../../../../shared/ui/Text';
import { colors, radius, spacing, typography } from '../../../../shared/theme/tokens';

type Props = {
  line: string;
  mood?: PipMood;
};

/** Pip with a short line in a speech bubble: the app's voice on the calmer steps. */
export function PipSays({ line, mood = 'hopeful' }: Props) {
  return (
    <Animated.View entering={FadeInDown.duration(320)} style={styles.row}>
      <Pip mood={mood} size={84} />
      <View style={styles.bubble}>
        <View style={styles.tail} />
        <Text style={styles.line}>{line}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  bubble: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  tail: {
    position: 'absolute',
    left: -6,
    top: '50%',
    marginTop: -7,
    width: 14,
    height: 14,
    backgroundColor: colors.surface,
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    transform: [{ rotate: '45deg' }],
    zIndex: 1,
  },
  line: {
    fontSize: typography.sizeMd,
    lineHeight: typography.sizeMd * 1.35,
    color: colors.ink,
    fontWeight: typography.weightMedium,
  },
});
