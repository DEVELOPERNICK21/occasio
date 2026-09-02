import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../../../shared/ui/Text';
import { colors, spacing, typography } from '../../../../shared/theme/tokens';

type Props = {
  label: string;
  children: ReactNode;
};

export function AddPersonSection({ label, children }: Props) {
  return (
    <View style={styles.root}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

export function AddPersonDivider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.sm,
  },
  label: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightSemibold,
    letterSpacing: 1.2,
    color: colors.muted,
    textTransform: 'uppercase',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    opacity: 0.6,
    marginVertical: spacing.xs,
  },
});
