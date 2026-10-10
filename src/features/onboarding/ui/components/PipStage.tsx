import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { Pip, type PipMood } from '../../../../shared/ui/Pip';
import { Text } from '../../../../shared/ui/Text';
import { colors, radius, spacing, typography } from '../../../../shared/theme/tokens';
import { ticketName, TICKET_EYEBROW } from '../../domain/onboardingFlow';
import type { Audience } from '../../../create/domain/templateSchema';
import { HEADLINE_FONT } from '../onboardingStyle';

/** The "A surprise for Mom" ticket from the recipient's gate, taped on. */
export function GiftTicket({ audience }: { audience: Audience | null }) {
  return (
    <View style={styles.ticketWrap}>
      <View style={[styles.tape, styles.tapeLeft]} />
      <View style={[styles.tape, styles.tapeRight]} />
      <View style={styles.ticket}>
        <Text style={styles.eyebrow}>{TICKET_EYEBROW.toUpperCase()}</Text>
        <Text style={styles.name} numberOfLines={1}>
          {ticketName(audience)}
        </Text>
      </View>
    </View>
  );
}

const CONFETTI: { x: number; y: number; r: number; color: string }[] = [
  { x: 6, y: 20, r: 6, color: colors.secondary },
  { x: 18, y: 64, r: 4, color: colors.rose },
  { x: 92, y: 12, r: 5, color: colors.butter },
  { x: 84, y: 58, r: 7, color: colors.accent },
  { x: 2, y: 46, r: 3, color: colors.sage },
  { x: 96, y: 36, r: 3, color: colors.secondary },
  { x: 12, y: 88, r: 5, color: colors.accent },
  { x: 88, y: 84, r: 4, color: colors.rose },
];

/** A handful of still confetti dots around Pip. Placed by percentage, so it fits any width. */
function Confetti() {
  return (
    <Animated.View entering={FadeIn.duration(320)} style={StyleSheet.absoluteFill} pointerEvents="none">
      {CONFETTI.map((dot, i) => (
        <View
          key={i}
          style={{
            ...styles.dot,
            left: `${dot.x}%`,
            top: `${dot.y}%`,
            width: dot.r * 2,
            height: dot.r * 2,
            borderRadius: dot.r,
            backgroundColor: dot.color,
          }}
        />
      ))}
    </Animated.View>
  );
}

type StageProps = {
  mood: PipMood;
  holdsGift?: boolean;
  size?: number;
  /** Above the ring: the gift ticket, or the opened card. */
  top?: ReactNode;
  confetti?: boolean;
  children?: ReactNode;
};

/** Pip in the middle of a dashed ring: the hero of the dream and fear steps. */
export function PipStage({ mood, holdsGift = false, size = 210, top, confetti = false, children }: StageProps) {
  const ring = size + 44;
  return (
    <View style={styles.stage}>
      {top}
      <View style={[styles.ringWrap, { width: ring, height: ring }]}>
        <Svg width={ring} height={ring} style={StyleSheet.absoluteFill} pointerEvents="none">
          <Circle
            cx={ring / 2}
            cy={ring / 2}
            r={ring / 2 - 3}
            stroke={colors.accent}
            strokeOpacity={0.35}
            strokeWidth={2}
            strokeDasharray="7 9"
            fill="none"
          />
        </Svg>
        <Pip mood={mood} size={size} holdsGift={holdsGift} />
      </View>
      {confetti ? <Confetti /> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  dot: { position: 'absolute' },
  stage: { alignItems: 'center', gap: spacing.sm },
  ringWrap: { alignItems: 'center', justifyContent: 'center' },
  ticketWrap: { alignItems: 'center', justifyContent: 'center', paddingTop: 6 },
  ticket: {
    minWidth: 150,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.accent,
    backgroundColor: colors.surface,
  },
  tape: {
    position: 'absolute',
    top: -2,
    width: 38,
    height: 16,
    backgroundColor: colors.butter,
    opacity: 0.8,
    zIndex: 1,
  },
  tapeLeft: { left: -10, transform: [{ rotate: '-32deg' }] },
  tapeRight: { right: -10, transform: [{ rotate: '32deg' }] },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 1.6,
    fontWeight: typography.weightMedium,
    color: colors.muted,
  },
  name: {
    fontSize: typography.sizeXl,
    lineHeight: typography.sizeXl * 1.15,
    fontFamily: HEADLINE_FONT,
    fontWeight: '700',
    color: colors.ink,
  },
});
