import { Image, StyleSheet, View } from 'react-native';
import { colors, radius, shadow, spacing } from '../../../../shared/theme/tokens';

/** Store launcher artwork — same icon as home screen / App Store. */
const LAUNCHER_ICON = require('../../../../../assets/brand/launcher-icon.png');

const RING_SIZE = 96;
const ICON_SIZE = 72;

export function LoginBrandMark() {
  return (
    <View style={styles.ring}>
      <Image
        source={LAUNCHER_ICON}
        style={styles.icon}
        accessibilityRole="image"
        accessibilityLabel="Occasio"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: radius.full,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.95)',
    ...shadow.card,
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 6,
    marginBottom: spacing.xs,
  },
  icon: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: radius.lg,
  },
});
