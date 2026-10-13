import { useCallback, useEffect, useRef, useState, type ComponentType, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { ChevronRight } from 'lucide-react-native';
import type { LucideProps } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { triggerCardHaptic } from '../platform/haptics';
import { useReduceMotion } from '../platform/useReduceMotion';
import { colors, overlay, radius, shadow, spacing, typography } from '../theme/tokens';
import { Button } from './Button';
import { Text } from './Text';

export type SheetAction = {
  id: string;
  label: string;
  /** One quiet line under the label. */
  description?: string;
  icon?: ComponentType<LucideProps>;
  /** `danger` for something that removes or cannot be undone. */
  tone?: 'default' | 'danger';
  onPress: () => void;
};

type Props = {
  visible: boolean;
  title: string;
  message?: string;
  /** Anything that belongs above the title, such as Pip. */
  header?: ReactNode;
  actions: readonly SheetAction[];
  cancelLabel?: string;
  /**
   * The sheet is closing. `action` when a choice was made (it runs a moment later),
   * `dismiss` for Cancel, a tap outside, or the phone's back button.
   */
  onClose: (reason: SheetCloseReason) => void;
};

export type SheetCloseReason = 'action' | 'dismiss';

const OUT_MS = 170;
/**
 * A native screen opened in the same moment this one is still closing can fail to
 * appear (iOS) or flash (Android), so the chosen action runs once the sheet is gone.
 */
export const SHEET_ACTION_DELAY_MS = OUT_MS + 90;
const ENTER_SPRING = { damping: 21, stiffness: 240, mass: 0.9 };
const ICON_SIZE = 20;
const ROW_ICON = 40;

/**
 * Our own bottom sheet for choices: pick a photo source, open a card's menu.
 * It replaces the stock Android dialog, which looks nothing like the app.
 */
export function ActionSheet({
  visible,
  title,
  message,
  header,
  actions,
  cancelLabel = 'Cancel',
  onClose,
}: Props) {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();
  const [mounted, setMounted] = useState(visible);
  const [height, setHeight] = useState(420);
  const progress = useSharedValue(0);
  const pending = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      progress.value = reduceMotion
        ? withTiming(1, { duration: 120 })
        : withSpring(1, ENTER_SPRING);
      return undefined;
    }
    progress.value = withTiming(0, { duration: OUT_MS });
    const timer = setTimeout(() => setMounted(false), OUT_MS);
    return () => clearTimeout(timer);
  }, [visible, reduceMotion, progress]);

  useEffect(
    () => () => {
      if (pending.current) clearTimeout(pending.current);
    },
    [],
  );

  const scrimStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - progress.value) * height }],
  }));

  const choose = useCallback(
    (action: SheetAction) => {
      triggerCardHaptic();
      onClose('action');
      pending.current = setTimeout(action.onPress, SHEET_ACTION_DELAY_MS);
    },
    [onClose],
  );
  const dismiss = useCallback(() => onClose('dismiss'), [onClose]);

  if (!mounted) return null;

  return (
    <Modal transparent visible animationType="none" statusBarTranslucent onRequestClose={dismiss}>
      <View style={styles.root}>
        <Animated.View style={[styles.scrim, scrimStyle]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={dismiss}
            accessibilityRole="button"
            accessibilityLabel={cancelLabel}
          />
        </Animated.View>

        <Animated.View
          accessibilityViewIsModal
          onLayout={(event) => setHeight(event.nativeEvent.layout.height)}
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.md) + spacing.sm }, sheetStyle]}
        >
          <View style={styles.handle} />
          {header ? <View style={styles.header}>{header}</View> : null}
          <Text style={styles.title} accessibilityRole="header">
            {title}
          </Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}

          {actions.length > 0 ? (
          <View style={styles.list}>
            {actions.map((action) => {
              const danger = action.tone === 'danger';
              const Icon = action.icon;
              return (
                <Pressable
                  key={action.id}
                  accessibilityRole="button"
                  accessibilityLabel={action.description ? `${action.label}. ${action.description}` : action.label}
                  onPress={() => choose(action)}
                  android_ripple={{ color: colors.accentSoft }}
                  style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                >
                  {Icon ? (
                    <View style={[styles.rowIcon, danger && styles.rowIconDanger]}>
                      <Icon
                        size={ICON_SIZE}
                        color={danger ? colors.error : colors.accent}
                        strokeWidth={2}
                        absoluteStrokeWidth
                      />
                    </View>
                  ) : null}
                  <View style={styles.rowText}>
                    <Text style={[styles.rowLabel, danger && styles.rowLabelDanger]}>{action.label}</Text>
                    {action.description ? (
                      <Text style={styles.rowDescription}>{action.description}</Text>
                    ) : null}
                  </View>
                  <ChevronRight size={18} color={colors.muted} strokeWidth={2} absoluteStrokeWidth />
                </Pressable>
              );
            })}
          </View>
          ) : null}

          <Button label={cancelLabel} variant="ghost" onPress={dismiss} />
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: overlay.scrim,
  },
  sheet: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.sm,
    borderTopLeftRadius: radius.xl + 4,
    borderTopRightRadius: radius.xl + 4,
    backgroundColor: colors.surface,
    ...shadow.card,
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 16,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: spacing.xs,
  },
  header: {
    alignItems: 'center',
  },
  title: {
    fontSize: typography.sizeLg,
    lineHeight: typography.sizeLg * 1.25,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
    letterSpacing: -0.2,
  },
  message: {
    fontSize: typography.sizeSm,
    lineHeight: typography.sizeSm * 1.45,
    color: colors.inkSoft,
  },
  list: {
    marginTop: spacing.xs,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
    overflow: 'hidden',
  },
  row: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  rowPressed: {
    backgroundColor: colors.sidebar,
  },
  rowIcon: {
    width: ROW_ICON,
    height: ROW_ICON,
    borderRadius: radius.full,
    backgroundColor: colors.sidebar,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowIconDanger: {
    backgroundColor: colors.errorSoft,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
  },
  rowLabelDanger: {
    color: colors.error,
  },
  rowDescription: {
    fontSize: typography.sizeXs + 1,
    lineHeight: (typography.sizeXs + 1) * 1.35,
    color: colors.muted,
  },
});
