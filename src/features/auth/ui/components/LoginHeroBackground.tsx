import { ImageBackground, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { colors } from '../../../../shared/theme/tokens';

const HERO = require('../../../../../assets/auth/login-hero.jpg');

/** Full-bleed hero with dark scrim so login copy stays readable. */
export function LoginHeroBackground() {
  return (
    <View style={styles.root} pointerEvents="none">
      <ImageBackground
        source={HERO}
        style={styles.image}
        imageStyle={styles.imageFocus}
        resizeMode="cover"
      />
      <View style={styles.darkBase} />
      <Svg style={styles.overlay} width="100%" height="100%" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="loginDarkScrim" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#1A1412" stopOpacity="0.42" />
            <Stop offset="0.45" stopColor="#1A1412" stopOpacity="0.52" />
            <Stop offset="1" stopColor="#1A1412" stopOpacity="0.78" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#loginDarkScrim)" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.ink,
  },
  image: {
    ...StyleSheet.absoluteFill,
  },
  imageFocus: {
    transform: [{ scale: 1.14 }, { translateY: -56 }],
  },
  darkBase: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.28)',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
  },
});
