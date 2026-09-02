import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { colors } from '../theme/tokens';

export type CardWashVariant =
  | 'birthday'
  | 'anniversary'
  | 'sorry'
  | 'proposal'
  | 'mothers_day'
  | 'fathers_day'
  | 'milestone'
  | 'upcoming';

type Props = {
  variant: CardWashVariant;
  primary: string;
  secondary: string;
};

/** Soft themed wash behind cards — readable, no stock photos. */
export function CardWashBackground({ variant, primary, secondary }: Props) {
  return (
    <View style={styles.layer} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 200 120" preserveAspectRatio="none">
        <Defs>
          <RadialGradient id="washA" cx="88%" cy="12%" rx="60%" ry="70%">
            <Stop offset="0%" stopColor={primary} stopOpacity={0.34} />
            <Stop offset="100%" stopColor={primary} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="washB" cx="8%" cy="92%" rx="52%" ry="58%">
            <Stop offset="0%" stopColor={secondary} stopOpacity={0.22} />
            <Stop offset="100%" stopColor={secondary} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="200" height="120" fill="url(#washA)" />
        <Rect x="0" y="0" width="200" height="120" fill="url(#washB)" />
        {variant === 'birthday' ? (
          <>
            <Circle cx="168" cy="22" r="3" fill={secondary} opacity={0.35} />
            <Circle cx="182" cy="34" r="2" fill={primary} opacity={0.28} />
          </>
        ) : null}
        {variant === 'anniversary' || variant === 'upcoming' ? (
          <Circle cx="175" cy="28" r="14" fill={primary} opacity={0.12} />
        ) : null}
        {variant === 'sorry' ? (
          <Circle cx="170" cy="24" r="10" fill={secondary} opacity={0.16} />
        ) : null}
        {variant === 'proposal' ? (
          <>
            <Circle cx="164" cy="18" r="2.5" fill={secondary} opacity={0.4} />
            <Circle cx="178" cy="30" r="2" fill={primary} opacity={0.35} />
            <Circle cx="186" cy="16" r="1.8" fill={secondary} opacity={0.3} />
          </>
        ) : null}
        {variant === 'mothers_day' ? (
          <Circle cx="172" cy="26" r="11" fill={secondary} opacity={0.18} />
        ) : null}
        {variant === 'fathers_day' ? (
          <Circle cx="168" cy="30" r="9" fill={secondary} opacity={0.15} />
        ) : null}
        {variant === 'milestone' ? (
          <Circle cx="180" cy="20" r="16" fill={primary} opacity={0.14} />
        ) : null}
      </Svg>
      <View style={styles.readabilityFade} />
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFill,
    zIndex: 0,
  },
  readabilityFade: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.surface,
    opacity: 0.42,
  },
});
