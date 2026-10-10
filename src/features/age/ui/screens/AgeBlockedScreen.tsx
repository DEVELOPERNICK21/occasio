import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../../../../shared/ui/Text';
import { colors, spacing, typography } from '../../../../shared/theme/tokens';
import { AGE_COPY } from '../../domain/ageGate';

const SUPPORT = 'mailto:developernick1@gmail.com?subject=Occasio%20age%20check';

export function AgeBlockedScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.lg }]}>
      <Text style={styles.title} accessibilityRole="header">
        {AGE_COPY.blockedTitle}
      </Text>
      <Text style={styles.body}>{AGE_COPY.blockedBody}</Text>
      <Pressable accessibilityRole="link" onPress={() => void Linking.openURL(SUPPORT)} hitSlop={8}>
        <Text style={styles.link}>{AGE_COPY.blockedHelp}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg, gap: spacing.md },
  title: {
    fontSize: typography.sizeXl,
    lineHeight: typography.sizeXl * 1.15,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
  },
  body: { fontSize: typography.sizeMd, lineHeight: typography.sizeMd * 1.45, color: colors.inkSoft },
  link: {
    fontSize: typography.sizeMd,
    color: colors.accentHover,
    textDecorationLine: 'underline',
    fontWeight: typography.weightMedium,
  },
});
