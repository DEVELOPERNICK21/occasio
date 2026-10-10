import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, onPhoto, spacing, typography } from '../theme/tokens';
import { Text } from './Text';

type Props = {
  label: string;
  children: ReactNode;
  hint?: string;
  tone?: 'default' | 'onDark';
};

export function Field({ label, children, hint, tone = 'default' }: Props) {
  const onDark = tone === 'onDark';

  return (
    <View style={styles.root}>
      <Text style={[styles.label, onDark && styles.labelOnDark]}>{label}</Text>
      {children}
      {hint ? <Text style={[styles.hint, onDark && styles.hintOnDark]}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.sm,
  },
  label: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightSemibold,
    color: colors.inkSoft,
  },
  hint: {
    fontSize: typography.sizeXs,
    color: colors.muted,
    lineHeight: typography.sizeXs * 1.4,
  },
  labelOnDark: {
    color: onPhoto.text,
  },
  hintOnDark: {
    color: onPhoto.textFaint,
  },
});
