import { useEffect, useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import type { ScreenEffectId } from '../../../domain/occasionEffects';
import { colors } from '../../../../../shared/theme/tokens';
import { GlossyBalloon } from './GlossyBalloon';
import { RisingHeart } from './RisingHeart';
import { SoftSparkle } from './SoftSparkle';

const BALLOON_PALETTE = [
  { color: '#E8615D', highlight: '#FFB4B0', shadow: '#B83F3C' },
  { color: '#F6A94A', highlight: '#FFE0A8', shadow: '#C97A1E' },
  { color: '#5B8DEF', highlight: '#B7D0FF', shadow: '#2F5FBF' },
  { color: '#7BC67E', highlight: '#C8F0CA', shadow: '#3F8F45' },
  { color: '#C77DFF', highlight: '#E8C8FF', shadow: '#8B45C4' },
  { color: '#FF6B9D', highlight: '#FFB3CB', shadow: '#C73B6E' },
  { color: '#4ECDC4', highlight: '#B8F0EB', shadow: '#2A9A92' },
  { color: '#FFB347', highlight: '#FFE0A0', shadow: '#C9841A' },
] as const;

const HEART_COLORS = ['#E8615D', '#FF4D6D', '#FF6B9D', '#F7C9B6', '#C9184A', '#FF8FA3'];

const CONFETTI_COLORS = [
  colors.primary,
  colors.secondary,
  colors.accentSoft,
  '#5B8DEF',
  '#7BC67E',
  '#C77DFF',
  '#FF6B9D',
  '#FFD166',
  colors.ink,
];

const SPARKLE_COLORS = [colors.secondary, '#FFE8A3', colors.white, colors.accentSoft, colors.primary];

type Props = {
  effectId: ScreenEffectId;
  height: number;
  replayKey: number;
  onFinished: () => void;
};

type ParticleSeed = {
  id: string;
  x: number;
  size: number;
  delayMs: number;
  durationMs: number;
  sway: number;
  colorIndex: number;
};

function seedField(count: number, replayKey: number): ParticleSeed[] {
  const out: ParticleSeed[] = [];
  for (let i = 0; i < count; i += 1) {
    const wave = (i * 37 + replayKey * 13) % 100;
    out.push({
      id: `p${replayKey}-${i}`,
      x: ((i * 47 + 19) % 100) / 100,
      size: 28 + (wave % 28),
      delayMs: (i * 180) % 2800,
      durationMs: 7200 + (wave % 35) * 80,
      sway: 14 + (i % 5) * 6,
      colorIndex: i,
    });
  }
  return out;
}

/**
 * Premium screen effects — SVG glossy balloons/hearts + real confetti cannons.
 * Replaces the flat generated Lottie shapes that read as cheap next to iMessage.
 */
export function PremiumScreenEffect({
  effectId,
  height,
  replayKey,
  onFinished,
}: Props) {
  const { width: windowWidth } = useWindowDimensions();
  const stageWidth = Math.min(windowWidth - 32, 420);
  const balloons = useMemo(() => seedField(14, replayKey), [replayKey]);
  const hearts = useMemo(() => seedField(16, replayKey), [replayKey]);
  const sparkles = useMemo(() => seedField(22, replayKey), [replayKey]);

  useEffect(() => {
    if (effectId !== 'balloons' && effectId !== 'hearts' && effectId !== 'sparkles') {
      return;
    }
    const ms =
      effectId === 'sparkles' ? 7800 : effectId === 'hearts' ? 8600 : 9000;
    const t = setTimeout(onFinished, ms);
    return () => clearTimeout(t);
  }, [effectId, replayKey, onFinished]);

  if (effectId === 'confetti') {
    return (
      <View pointerEvents="none" style={[styles.layer, { height, width: '100%' }]}>
        <ConfettiCannon
          key={`cc-a-${replayKey}`}
          count={180}
          origin={{ x: stageWidth * 0.12, y: -24 }}
          explosionSpeed={400}
          fallSpeed={3400}
          fadeOut
          autoStart
          colors={CONFETTI_COLORS}
        />
        <ConfettiCannon
          key={`cc-b-${replayKey}`}
          count={180}
          origin={{ x: stageWidth * 0.88, y: -16 }}
          explosionSpeed={380}
          fallSpeed={3600}
          fadeOut
          autoStart
          autoStartDelay={160}
          colors={CONFETTI_COLORS}
        />
        <ConfettiCannon
          key={`cc-c-${replayKey}`}
          count={120}
          origin={{ x: stageWidth * 0.5, y: -30 }}
          explosionSpeed={360}
          fallSpeed={3800}
          fadeOut
          autoStart
          autoStartDelay={320}
          colors={CONFETTI_COLORS}
          onAnimationEnd={onFinished}
        />
      </View>
    );
  }

  if (effectId === 'celebration') {
    return (
      <View pointerEvents="none" style={[styles.layer, { height, width: '100%' }]}>
        <ConfettiCannon
          key={`cel-1-${replayKey}`}
          count={120}
          origin={{ x: stageWidth * 0.5, y: height * 0.35 }}
          explosionSpeed={520}
          fallSpeed={2800}
          fadeOut
          autoStart
          colors={CONFETTI_COLORS}
        />
        <ConfettiCannon
          key={`cel-2-${replayKey}`}
          count={100}
          origin={{ x: stageWidth * 0.2, y: height * 0.55 }}
          explosionSpeed={460}
          fallSpeed={3000}
          fadeOut
          autoStart
          autoStartDelay={400}
          colors={CONFETTI_COLORS}
        />
        <ConfettiCannon
          key={`cel-3-${replayKey}`}
          count={100}
          origin={{ x: stageWidth * 0.8, y: height * 0.5 }}
          explosionSpeed={460}
          fallSpeed={3000}
          fadeOut
          autoStart
          autoStartDelay={700}
          colors={CONFETTI_COLORS}
          onAnimationEnd={onFinished}
        />
      </View>
    );
  }

  if (effectId === 'balloons') {
    return (
      <View pointerEvents="none" style={[styles.layer, { height, width: '100%' }]}>
        {balloons.map((p) => {
          const pal = BALLOON_PALETTE[p.colorIndex % BALLOON_PALETTE.length]!;
          return (
            <GlossyBalloon
              key={p.id}
              left={p.x * stageWidth}
              size={p.size}
              color={pal.color}
              highlight={pal.highlight}
              shadow={pal.shadow}
              delayMs={p.delayMs}
              durationMs={p.durationMs}
              fallDistance={height}
              sway={p.sway}
              replayKey={replayKey}
            />
          );
        })}
      </View>
    );
  }

  if (effectId === 'hearts') {
    return (
      <View pointerEvents="none" style={[styles.layer, { height, width: '100%' }]}>
        {hearts.map((p) => (
          <RisingHeart
            key={p.id}
            left={p.x * stageWidth}
            size={18 + (p.size % 22)}
            color={HEART_COLORS[p.colorIndex % HEART_COLORS.length]!}
            delayMs={p.delayMs}
            durationMs={p.durationMs}
            fallDistance={height}
            sway={p.sway}
            replayKey={replayKey}
          />
        ))}
      </View>
    );
  }

  // sparkles
  return (
    <View pointerEvents="none" style={[styles.layer, { height, width: '100%' }]}>
      {sparkles.map((p) => (
        <SoftSparkle
          key={p.id}
          left={p.x * stageWidth}
          top={(0.12 + ((p.colorIndex * 37) % 70) / 100) * height}
          size={10 + (p.size % 14)}
          delayMs={p.delayMs % 1600}
          color={SPARKLE_COLORS[p.colorIndex % SPARKLE_COLORS.length]!}
          replayKey={replayKey}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    elevation: 20,
    overflow: 'visible',
  },
});
