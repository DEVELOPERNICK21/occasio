import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { spacing } from '../theme/tokens';

type Props = {
  children: ReactNode;
  /** `start` for text-style / secondary actions; `stretch` for full-width stacks. */
  align?: 'stretch' | 'start';
};

/** Inline action group at the end of screen content — not a sticky footer dock. */
export function ScreenActions({ children, align = 'stretch' }: Props) {
  return (
    <View style={[styles.root, align === 'start' && styles.start]}>{children}</View>
  );
}

const styles = StyleSheet.create({
  root: {
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  start: {
    alignItems: 'flex-start',
  },
});
