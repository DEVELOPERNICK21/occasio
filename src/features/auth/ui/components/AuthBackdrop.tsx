import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { colors } from '../../../../shared/theme/tokens';

/**
 * The warm wash behind sign-in: peach at the top where Pip stands, a touch of
 * butter low on the other side, and a few confetti dots. No photo, so it reads
 * like the rest of the app.
 */
export function AuthBackdrop() {
  return (
    <View style={styles.layer} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 200 400" preserveAspectRatio="xMidYMid slice">
        <Defs>
          <RadialGradient id="authPeach" cx="50%" cy="14%" rx="78%" ry="42%">
            <Stop offset="0%" stopColor={colors.tertiary} stopOpacity={0.75} />
            <Stop offset="100%" stopColor={colors.tertiary} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="authButter" cx="94%" cy="78%" rx="55%" ry="30%">
            <Stop offset="0%" stopColor={colors.butter} stopOpacity={0.3} />
            <Stop offset="100%" stopColor={colors.butter} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="200" height="400" fill="url(#authPeach)" />
        <Rect x="0" y="0" width="200" height="400" fill="url(#authButter)" />
        <Circle cx="176" cy="40" r="2.6" fill={colors.secondary} opacity={0.55} />
        <Circle cx="188" cy="86" r="1.8" fill={colors.accent} opacity={0.4} />
        <Circle cx="164" cy="128" r="2.4" fill={colors.rose} opacity={0.35} />
        <Circle cx="186" cy="176" r="2" fill={colors.secondary} opacity={0.4} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.bg,
  },
});
