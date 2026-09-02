import { Linking, StyleSheet, View } from 'react-native';
import { env } from '../../../../shared/config/env';
import { Text } from '../../../../shared/ui/Text';
import { colors, typography } from '../../../../shared/theme/tokens';

const TERMS_URL = `${env.shareBaseUrl}/terms`;
const PRIVACY_URL = `${env.shareBaseUrl}/privacy`;

export function AuthLegalFooter({ onDark = false }: { onDark?: boolean }) {
  const openUrl = (url: string) => {
    void Linking.openURL(url);
  };

  return (
    <View style={styles.root}>
      <Text style={[styles.copy, onDark && styles.copyOnDark]}>
        By continuing, you agree to our{' '}
        <Text
          style={[styles.link, onDark && styles.linkOnDark]}
          onPress={() => openUrl(TERMS_URL)}
          accessibilityRole="link"
        >
          Terms of Service
        </Text>{' '}
        and{' '}
        <Text
          style={[styles.link, onDark && styles.linkOnDark]}
          onPress={() => openUrl(PRIVACY_URL)}
          accessibilityRole="link"
        >
          Privacy Policy
        </Text>
        .
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: 8,
  },
  copy: {
    fontSize: typography.sizeXs,
    lineHeight: typography.sizeXs * 1.55,
    color: colors.inkSoft,
    textAlign: 'center',
  },
  link: {
    textDecorationLine: 'underline',
    color: colors.ink,
    fontWeight: typography.weightMedium,
  },
  copyOnDark: {
    color: 'rgba(255, 255, 255, 0.72)',
  },
  linkOnDark: {
    color: colors.white,
  },
});
