import { useEffect, useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import type { BusyKind } from '../mascot/busyLines';
import { colors, overlay, radius, shadow, spacing } from '../theme/tokens';
import { PipLoader } from './PipLoader';

type Props = {
  visible: boolean;
  kind: BusyKind;
  holdsGift?: boolean;
};

/**
 * Not worth a dialog if the work finishes at once; and an iOS Modal opened in
 * the same moment an Alert is closing never appears. Waiting a beat fixes both.
 */
const SHOW_AFTER_MS = 250;

/**
 * Blocks the screen while a slow action runs (deleting a card or an account),
 * with Pip and a line that changes the longer it takes. It cannot be dismissed:
 * the caller hides it when the work ends, success or not.
 */
export function BusyOverlay({ visible, kind, holdsGift = false }: Props) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (!visible) return undefined;
    const timer = setTimeout(() => setShown(true), SHOW_AFTER_MS);
    return () => {
      clearTimeout(timer);
      setShown(false);
    };
  }, [visible]);

  if (!visible || !shown) return null;

  return (
    <Modal
      transparent
      visible
      animationType="fade"
      statusBarTranslucent
      // Back must not interrupt the work half way through.
      onRequestClose={() => undefined}
    >
      <View style={styles.scrim}>
        <View style={styles.card} accessibilityViewIsModal>
          <PipLoader kind={kind} holdsGift={holdsGift} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: overlay.scrim,
  },
  card: {
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    ...shadow.card,
    shadowOpacity: 0.2,
    elevation: 8,
  },
});
