import { useCallback, useEffect } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Clipboard from '@react-native-clipboard/clipboard';
import { Text } from '../../../../shared/ui/Text';
import { triggerSuccessHaptic } from '../../../../shared/platform/haptics';
import { colors, radius, spacing, typography } from '../../../../shared/theme/tokens';
import type { TemplateTheme } from '../../domain/templateTheme';

type Props = {
  shareUrl: string;
  expiresAt: string;
  theme: TemplateTheme;
  copied: boolean;
  onCopied: () => void;
};

function splitShareUrl(url: string): { host: string; path: string } {
  try {
    const parsed = new URL(url);
    const host = parsed.host;
    const path = `${parsed.pathname}${parsed.search}`;
    return { host, path: path === '/' ? '' : path };
  } catch {
    const slash = url.indexOf('/', url.indexOf('://') + 3);
    if (slash === -1) return { host: url, path: '' };
    return { host: url.slice(0, slash), path: url.slice(slash) };
  }
}

export function ShareLinkPanel({
  shareUrl,
  expiresAt,
  theme,
  copied,
  onCopied,
}: Props) {
  const pulse = useSharedValue(1);
  const checkScale = useSharedValue(copied ? 1 : 0);
  const { host, path } = splitShareUrl(shareUrl);
  const expiryLabel = new Date(expiresAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.35, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, [pulse]);

  useEffect(() => {
    checkScale.value = withTiming(copied ? 1 : 0, {
      duration: copied ? 220 : 150,
      easing: Easing.out(Easing.cubic),
    });
  }, [copied, checkScale]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: 0.55 + (pulse.value - 1) * 0.8,
  }));

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
    opacity: checkScale.value,
  }));

  const handleCopy = useCallback(() => {
    try {
      Clipboard.setString(shareUrl);
      triggerSuccessHaptic();
      onCopied();
    } catch {
      Alert.alert('Could not copy', 'Long-press the link below to copy manually.');
    }
  }, [onCopied, shareUrl]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={copied ? 'Link copied' : 'Copy share link'}
      accessibilityHint="Copies the private wish link to your clipboard"
      onPress={handleCopy}
      style={({ pressed }) => [
        styles.panel,
        { borderColor: theme.accent },
        pressed && styles.panelPressed,
      ]}
    >
      <View style={styles.liveRow}>
        <Animated.View
          style={[
            styles.liveDot,
            { backgroundColor: theme.accent },
            pulseStyle,
          ]}
        />
        <Text style={[styles.liveLabel, { color: theme.accent }]}>
          {copied ? 'Copied to clipboard' : 'Live link — tap to copy'}
        </Text>
        <Animated.View style={[styles.checkWrap, checkStyle]}>
          <Text style={[styles.checkMark, { color: theme.accent }]}>✓</Text>
        </Animated.View>
      </View>

      <View style={[styles.urlRow, { backgroundColor: theme.softBackground }]}>
        <Text style={styles.urlHost} numberOfLines={1}>
          {host}
        </Text>
        {path ? (
          <Text style={styles.urlPath} numberOfLines={2}>
            {path}
          </Text>
        ) : null}
      </View>

      <Text style={styles.expiry}>Active until {expiryLabel}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderWidth: 1,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    gap: spacing.md,
  },
  panelPressed: {
    opacity: 0.92,
  },
  liveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
  },
  liveLabel: {
    flex: 1,
    fontSize: typography.sizeSm,
    fontWeight: typography.weightMedium,
  },
  checkWrap: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
  },
  urlRow: {
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  urlHost: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
  },
  urlPath: {
    fontSize: typography.sizeSm,
    color: colors.muted,
    lineHeight: typography.sizeSm * 1.45,
  },
  expiry: {
    fontSize: typography.sizeXs,
    color: colors.muted,
  },
});
