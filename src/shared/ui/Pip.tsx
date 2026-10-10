import { useEffect, useId } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, Ellipse, G, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { mascot } from '../theme/tokens';

export type PipMood = 'hopeful' | 'joy' | 'wink' | 'cry' | 'shocked';

type Props = {
  mood: PipMood;
  /** Rendered width in px; height follows the artwork. */
  size?: number;
  /** The wrapped gift Pip holds in front (hopeful and wink only). */
  holdsGift?: boolean;
  /** A gentle bob. Finite on purpose, so it never keeps the accessibility tree busy. */
  bob?: boolean;
};

/** Bobs a few times, then rests. */
export const PIP_BOB_CYCLES = 4;

const VIEW_W = 280;
const VIEW_H = 310;

function Eyes({ mood }: { mood: PipMood }) {
  const { ink } = mascot;
  switch (mood) {
    case 'shocked':
      return (
        <G>
          <Ellipse cx="86" cy="120" rx="23" ry="29" fill="#fff" />
          <Ellipse cx="154" cy="120" rx="23" ry="29" fill="#fff" />
          <Circle cx="86" cy="122" r="5.5" fill={ink} />
          <Circle cx="154" cy="122" r="5.5" fill={ink} />
          <Path d="M62 82Q86 66 110 80" stroke={ink} strokeWidth="4.5" strokeLinecap="round" fill="none" />
          <Path d="M130 80Q154 66 178 82" stroke={ink} strokeWidth="4.5" strokeLinecap="round" fill="none" />
        </G>
      );
    case 'cry':
      return (
        <G>
          <Ellipse cx="86" cy="122" rx="19" ry="22" fill="#fff" />
          <Ellipse cx="154" cy="122" rx="19" ry="22" fill="#fff" />
          <Circle cx="86" cy="126" r="14" fill={ink} />
          <Circle cx="154" cy="126" r="14" fill={ink} />
          <Circle cx="91" cy="119" r="6" fill="#fff" />
          <Circle cx="149" cy="119" r="6" fill="#fff" />
          <Circle cx="82" cy="133" r="3" fill="#fff" opacity={0.85} />
          <Circle cx="158" cy="133" r="3" fill="#fff" opacity={0.85} />
          <Path d="M66 134Q86 152 106 134Q86 143 66 134Z" fill="#8FD3FF" opacity={0.9} />
          <Path d="M134 134Q154 152 174 134Q154 143 134 134Z" fill="#8FD3FF" opacity={0.9} />
          <Path d="M64 100Q84 100 108 88" stroke={ink} strokeWidth="4.5" strokeLinecap="round" fill="none" />
          <Path d="M132 88Q156 100 176 100" stroke={ink} strokeWidth="4.5" strokeLinecap="round" fill="none" />
        </G>
      );
    case 'joy':
      return (
        <G>
          <Path d="M66 126Q86 96 106 126" stroke={ink} strokeWidth="6.5" strokeLinecap="round" fill="none" />
          <Path d="M134 126Q154 96 174 126" stroke={ink} strokeWidth="6.5" strokeLinecap="round" fill="none" />
        </G>
      );
    case 'wink':
      return (
        <G>
          <Path d="M66 126Q86 96 106 126" stroke={ink} strokeWidth="6.5" strokeLinecap="round" fill="none" />
          <Ellipse cx="154" cy="122" rx="19" ry="24" fill="#fff" />
          <Circle cx="152" cy="126" r="13" fill={ink} />
          <Circle cx="147" cy="119" r="5.2" fill="#fff" />
          <Circle cx="157" cy="133" r="2.6" fill="#fff" opacity={0.9} />
          <Path d="M132 92Q154 78 176 90" stroke={ink} strokeWidth="4.5" strokeLinecap="round" fill="none" />
        </G>
      );
    case 'hopeful':
    default:
      return (
        <G>
          <Ellipse cx="86" cy="122" rx="19" ry="24" fill="#fff" />
          <Ellipse cx="154" cy="122" rx="19" ry="24" fill="#fff" />
          <Circle cx="88" cy="126" r="13.5" fill={ink} />
          <Circle cx="152" cy="126" r="13.5" fill={ink} />
          <Circle cx="93" cy="119" r="5.4" fill="#fff" />
          <Circle cx="147" cy="119" r="5.4" fill="#fff" />
          <Circle cx="83" cy="132" r="2.6" fill="#fff" opacity={0.9} />
          <Circle cx="157" cy="132" r="2.6" fill="#fff" opacity={0.9} />
          <Path d="M66 94Q86 80 106 92" stroke={ink} strokeWidth="4.5" strokeLinecap="round" fill="none" />
          <Path d="M134 92Q154 80 174 94" stroke={ink} strokeWidth="4.5" strokeLinecap="round" fill="none" />
        </G>
      );
  }
}

function Mouth({ mood }: { mood: PipMood }) {
  const { ink, mouth, tongue } = mascot;
  switch (mood) {
    case 'shocked':
      return (
        <G>
          <Ellipse cx="120" cy="171" rx="11" ry="15" fill={mouth} />
          <Ellipse cx="120" cy="179" rx="7" ry="6" fill={tongue} />
        </G>
      );
    case 'cry':
      return (
        <G>
          <Path d="M96 182Q120 148 144 182Q120 170 96 182Z" fill={mouth} />
          <Ellipse cx="120" cy="176" rx="8" ry="4" fill={tongue} />
        </G>
      );
    case 'joy':
      return (
        <G>
          <Path d="M90 150Q120 200 150 150Z" fill={mouth} />
          <Path d="M97 152Q120 160 143 152L141 148Q120 155 99 148Z" fill="#fff" />
          <Ellipse cx="120" cy="177" rx="12" ry="8" fill={tongue} />
        </G>
      );
    case 'wink':
      return (
        <G>
          <Path d="M98 156Q120 178 142 156" stroke={ink} strokeWidth="4.5" strokeLinecap="round" fill="none" />
          <Ellipse cx="134" cy="171" rx="7" ry="9" fill={tongue} />
        </G>
      );
    case 'hopeful':
    default:
      return <Path d="M103 158Q120 174 137 158" stroke={ink} strokeWidth="4.5" strokeLinecap="round" fill="none" />;
  }
}

function PartyHat() {
  return (
    <G transform="rotate(-9 120 44)">
      <Path d="M82 46L120 -32L158 46Z" fill={mascot.hatRed} />
      <Path d="M98 14L142 14L150 32L90 32Z" fill={mascot.hatBand} />
      <Path d="M104 -2L136 -2L141 10L99 10Z" fill={mascot.hatBlue} opacity={0.85} />
      <Ellipse cx="120" cy="46" rx="41" ry="8.5" fill={mascot.hatBrim} />
      <Circle cx="120" cy="-33" r="10" fill="#fff" />
      <Circle cx="117" cy="-36" r="3.5" fill="#fff" opacity={0.8} />
    </G>
  );
}

function Violin() {
  return (
    <G transform="translate(198 184) rotate(-28) scale(1.3)">
      <Ellipse cx="0" cy="8" rx="15" ry="19" fill="#A0522D" stroke="#6B3418" strokeWidth="2" />
      <Ellipse cx="0" cy="-14" rx="11" ry="13" fill="#A0522D" stroke="#6B3418" strokeWidth="2" />
      <Rect x="-3" y="-52" width="6" height="30" rx="2" fill="#3A2312" />
      <Path d="M-5 6Q-1 10 -5 16M5 6Q1 10 5 16" stroke="#3A2312" strokeWidth="2" fill="none" />
      <Path d="M-26 -4L30 20" stroke="#E8D5A3" strokeWidth="3" strokeLinecap="round" />
    </G>
  );
}

function Sparkles() {
  return (
    <G fill={mascot.hatBand}>
      <Path d="M-6 30l3 8 8 3-8 3-3 8-3-8-8-3 8-3z" />
      <Path d="M244 40l3 8 8 3-8 3-3 8-3-8-8-3 8-3z" />
      <Path d="M232 -10l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" />
    </G>
  );
}

/**
 * Pip: Occasio's mascot, drawn natively from the same artwork the recipient
 * sees on the web. Five moods, one party hat. Pip is how the app talks.
 */
export function Pip({ mood, size = 200, holdsGift = false, bob = true }: Props) {
  const uid = useId().replace(/:/g, '');
  const lift = useSharedValue(0);

  useEffect(() => {
    if (!bob) {
      return;
    }
    lift.value = withRepeat(
      withSequence(withTiming(-7, { duration: 1100 }), withTiming(0, { duration: 1100 })),
      PIP_BOB_CYCLES,
    );
  }, [bob, lift]);

  const bobStyle = useAnimatedStyle(() => ({ transform: [{ translateY: lift.value }] }));
  const { light, base, shade, cheek } = mascot;
  const cheekOpacity = mood === 'joy' || mood === 'wink' ? 0.85 : 0.6;
  const armsUp = mood === 'joy';

  return (
    <Animated.View style={[styles.root, { width: size, height: (size * VIEW_H) / VIEW_W }, bobStyle]}>
      <Svg
        width={size}
        height={(size * VIEW_H) / VIEW_W}
        viewBox={`-20 -46 ${VIEW_W} ${VIEW_H}`}
        accessible
        accessibilityRole="image"
        accessibilityLabel={`Pip looking ${mood}`}
      >
        <Defs>
          <RadialGradient id={`${uid}-body`} cx="36%" cy="26%" r="82%">
            <Stop offset="0%" stopColor={light} />
            <Stop offset="58%" stopColor={base} />
            <Stop offset="100%" stopColor={shade} />
          </RadialGradient>
        </Defs>

        <Ellipse cx="120" cy="247" rx="80" ry="9" fill="#000" opacity={0.16} />

        <Ellipse cx="84" cy="236" rx="27" ry="12" fill={shade} />
        <Ellipse cx="156" cy="236" rx="27" ry="12" fill={shade} />

        {armsUp ? (
          <G>
            <Ellipse cx="14" cy="104" rx="15" ry="27" fill={base} transform="rotate(-38 14 104)" />
            <Ellipse cx="226" cy="104" rx="15" ry="27" fill={base} transform="rotate(38 226 104)" />
          </G>
        ) : (
          <G>
            <Ellipse cx="22" cy="152" rx="15" ry="27" fill={base} transform="rotate(14 22 152)" />
            <Ellipse cx="218" cy="152" rx="15" ry="27" fill={base} transform="rotate(-14 218 152)" />
          </G>
        )}

        <Path
          d="M120 24C178 24 214 76 214 138C214 196 178 232 120 232C62 232 26 196 26 138C26 76 62 24 120 24Z"
          fill={`url(#${uid}-body)`}
        />
        <Ellipse cx="78" cy="70" rx="30" ry="17" fill="#fff" opacity={0.28} transform="rotate(-24 78 70)" />
        <Ellipse cx="56" cy="152" rx="15" ry="9.5" fill={cheek} opacity={cheekOpacity} />
        <Ellipse cx="184" cy="152" rx="15" ry="9.5" fill={cheek} opacity={cheekOpacity} />

        <Eyes mood={mood} />
        <Mouth mood={mood} />

        {holdsGift && (mood === 'hopeful' || mood === 'wink') ? (
          <G>
            <Rect x="82" y="182" width="76" height="52" rx="8" fill={mascot.giftPaper} />
            <Rect x="112" y="182" width="16" height="52" fill={mascot.giftRibbon} />
            <Rect x="82" y="200" width="76" height="12" fill={mascot.giftRibbon} opacity={0.9} />
            <Ellipse cx="108" cy="178" rx="16" ry="9" fill={mascot.giftRibbon} transform="rotate(-18 108 178)" />
            <Ellipse cx="132" cy="178" rx="16" ry="9" fill={mascot.hatBrim} transform="rotate(18 132 178)" />
            <Circle cx="120" cy="182" r="6" fill={mascot.hatBrim} />
            <Ellipse cx="80" cy="214" rx="12" ry="15" fill={base} />
            <Ellipse cx="160" cy="214" rx="12" ry="15" fill={base} />
          </G>
        ) : null}

        <PartyHat />

        {mood === 'cry' ? (
          <G>
            <Path d="M78 140C70 168 66 198 64 236" stroke={mascot.tear} strokeWidth="8" strokeLinecap="round" fill="none" opacity={0.85} />
            <Path d="M162 140C170 168 174 198 176 236" stroke={mascot.tear} strokeWidth="8" strokeLinecap="round" fill="none" opacity={0.85} />
            <Violin />
          </G>
        ) : null}

        {mood === 'joy' ? <Sparkles /> : null}
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'center', justifyContent: 'center' },
});
