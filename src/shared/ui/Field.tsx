import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, spacing, typography } from '../theme/tokens';
import { Text } from './Text';

type Props = {
  label: string;
  children: ReactNode;
  hint?: string;
};

export function Field({ label, children, hint }: Props) {
  return (
    <View style={styles.root}>
      <Text style={styles.label}>{label}</Text>
      {children}
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
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
});
