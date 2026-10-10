import { Image, StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { colors, onPhoto } from '../../../../shared/theme/tokens';
import { heroFrame, type HeroFraming } from './loginHeroFrame';

const HERO = require('../../../../../assets/auth/login-hero.jpg');

type Props = {
  /** `couple` for the welcome step; `sky` behind forms so text stays legible. */
  framing?: HeroFraming;
};

/** Full-bleed hero with a dark scrim so login copy stays readable. */
export function LoginHeroBackground({ framing = 'couple' }: Props) {
  const { width, height } = useWindowDimensions();
  const frame = heroFrame(width, height, framing);
  // Forms sit on the photo, so they get a heavier veil than the welcome step.
  const veil = framing === 'sky' ? 0.2 : 0;

  return (
    <View style={styles.root} pointerEvents="none">
      <Image
        source={HERO}
        style={[styles.image, frame]}
        resizeMode="cover"
        accessible={false}
      />
      <Svg style={styles.overlay} width="100%" height="100%" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="loginDarkScrim" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={onPhoto.scrim} stopOpacity={0.28 + veil} />
            <Stop offset="0.38" stopColor={onPhoto.scrim} stopOpacity={0.36 + veil} />
            <Stop offset="0.62" stopColor={onPhoto.scrim} stopOpacity={0.72 + veil / 2} />
            <Stop offset="0.82" stopColor={onPhoto.scrim} stopOpacity={1} />
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
    overflow: 'hidden',
  },
  image: {
    position: 'absolute',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
  },
});
