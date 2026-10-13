import { StyleSheet, View } from 'react-native';
import { CircleAlert } from 'lucide-react-native';
import { Text } from '../../../../shared/ui/Text';
import { colors, radius, spacing, typography } from '../../../../shared/theme/tokens';

/** What went wrong while signing in, in words, read out when it appears. */
export function AuthErrorBanner({ message }: { message: string }) {
  return (
    <View style={styles.banner} accessibilityLiveRegion="polite" accessibilityRole="alert">
      <CircleAlert size={18} color={colors.error} strokeWidth={2.2} absoluteStrokeWidth />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.errorSoft,
  },
  text: {
    flex: 1,
    fontSize: typography.sizeSm,
    lineHeight: typography.sizeSm * 1.4,
    color: colors.error,
  },
});
