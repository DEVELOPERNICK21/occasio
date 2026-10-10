import { useId } from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { colors } from '../../../../shared/theme/tokens';

export type BackdropTone = 'calm' | 'warm' | 'tender';

const STOPS: Record<BackdropTone, [string, string, string]> = {
  // Quiet: the choice steps, where nothing should compete with the question.
  calm: [colors.sidebar, colors.bg, colors.bg],
  // The dream: butter-yellow light at the top, like the recipient's gate.
  warm: [colors.butterSoft, colors.sidebar, colors.bg],
  // The fear: the same warmth with the light turned down, rose instead of gold.
  tender: [colors.roseSoft, colors.sidebar, colors.bg],
};

type Props = { tone: BackdropTone };

/** A soft vertical wash behind a step. Tinted tokens only; it never carries information. */
export function StepBackdrop({ tone }: Props) {
  const id = useId().replace(/:/g, '');
  const [top, mid, bottom] = STOPS[tone];

  return (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none" preserveAspectRatio="none">
      <Defs>
        <LinearGradient id={`${id}-wash`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={top} />
          <Stop offset="0.45" stopColor={mid} />
          <Stop offset="1" stopColor={bottom} />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id}-wash)`} />
    </Svg>
  );
}
