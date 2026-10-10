import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
} from 'react-native-reanimated';
import { Text } from '../../../../shared/ui/Text';
import { colors, radius, spacing, typography } from '../../../../shared/theme/tokens';
import {
  AUTO_SEND_TIMELINE,
  REMEMBER_TRUST_LINE,
  type TimelineStep,
} from '../../domain/onboardingFlow';

const STAGGER_MS = 220;

function TimelineRow({ step, index, last }: { step: TimelineStep; index: number; last: boolean }) {
  const progress = useSharedValue(0);

  // Plays once when the step appears: each stage lights up after the one before it.
  useEffect(() => {
    progress.value = withDelay(260 + index * STAGGER_MS, withSpring(1, { damping: 16, stiffness: 170 }));
  }, [index, progress]);

  const fillStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
  const textStyle = useAnimatedStyle(() => ({ opacity: 0.45 + 0.55 * progress.value }));
  const lineStyle = useAnimatedStyle(() => ({ opacity: progress.value }));

  return (
    <View style={styles.row}>
      <View style={styles.rail}>
        <View style={styles.node}>
          <Animated.View style={[styles.nodeFill, fillStyle]} />
        </View>
        {last ? null : (
          <View style={styles.line}>
            <Animated.View style={[styles.lineFill, lineStyle]} />
          </View>
        )}
      </View>
      <Animated.View style={[styles.copy, textStyle]}>
        <Text style={styles.title}>{step.title}</Text>
        <Text style={styles.detail}>{step.detail}</Text>
      </Animated.View>
    </View>
  );
}

/**
 * The relief, shown rather than told: the real auto-send sequence lighting up
 * one stage at a time, ending on the review window. Nothing here is armed.
 */
export function AutoSendTimeline() {
  return (
    <View style={styles.root}>
      <View style={styles.card}>
        <View style={styles.tagRow}>
          <Text style={styles.tag}>Auto-send</Text>
          <View style={styles.pro}>
            <Text style={styles.proLabel}>Occasio Pro</Text>
          </View>
        </View>
        <View style={styles.timeline}>
          {AUTO_SEND_TIMELINE.map((step, index) => (
            <TimelineRow
              key={step.id}
              step={step}
              index={index}
              last={index === AUTO_SEND_TIMELINE.length - 1}
            />
          ))}
        </View>
      </View>
      <Text style={styles.trust}>{REMEMBER_TRUST_LINE}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.md },
  card: {
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.sm,
  },
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  tag: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
  },
  pro: {
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.accentSoft,
  },
  proLabel: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightSemibold,
    color: colors.accentHover,
  },
  timeline: { paddingHorizontal: spacing.xs },
  row: { flexDirection: 'row', gap: spacing.md, minHeight: 60 },
  rail: { width: 22, alignItems: 'center' },
  node: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  nodeFill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.accent },
  line: { width: 2, flex: 1, backgroundColor: colors.border, marginVertical: 2 },
  lineFill: { flex: 1, backgroundColor: colors.accent },
  copy: { flex: 1, paddingBottom: spacing.sm, gap: 2 },
  title: {
    fontSize: typography.sizeMd,
    lineHeight: typography.sizeMd * 1.25,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
  },
  detail: { fontSize: typography.sizeSm, color: colors.inkSoft },
  trust: {
    fontSize: typography.sizeSm,
    lineHeight: typography.sizeSm * 1.45,
    color: colors.inkSoft,
    textAlign: 'center',
  },
});
