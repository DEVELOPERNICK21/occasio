import { StyleSheet, View } from 'react-native';
import { FestivalArt } from '../../../../shared/ui/art/FestivalArt';
import { ornamentMotifs } from '../../domain/festivalArt';

type Props = {
  /** The card type. Anything that is not a festival draws nothing. */
  templateType: string | null;
};

/**
 * A festival card's own drawings in its corners, so a Diwali card has its diya and its rocket and a
 * Christmas card its Santa and its tree. They sit over the card without taking taps, small enough to
 * leave the photo and the words alone.
 */
export function FestivalOrnaments({ templateType }: Props) {
  const [hero, second, third] = ornamentMotifs(templateType);
  if (!hero) return null;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={[styles.corner, styles.topLeft]}>
        <FestivalArt motif={hero} size={46} />
      </View>
      {second ? (
        <View style={[styles.corner, styles.topRight]}>
          <FestivalArt motif={second} size={40} />
        </View>
      ) : null}
      {third ? (
        <View style={[styles.corner, styles.bottomLeft]}>
          <FestivalArt motif={third} size={34} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  corner: {
    position: 'absolute',
  },
  topLeft: {
    top: 6,
    left: 6,
    transform: [{ rotate: '-10deg' }],
  },
  topRight: {
    top: 8,
    right: 8,
    transform: [{ rotate: '10deg' }],
  },
  bottomLeft: {
    bottom: 8,
    left: 8,
    transform: [{ rotate: '-6deg' }],
  },
});
