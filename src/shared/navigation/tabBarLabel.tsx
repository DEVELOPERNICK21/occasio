import type { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import { Text } from '../ui/Text';
import { typography } from '../theme/tokens';

export const lockedTabBarLabel: BottomTabNavigationOptions['tabBarLabel'] = ({
  children,
  color,
}) => (
  <Text
    numberOfLines={1}
    style={{
      color,
      fontSize: typography.sizeXs,
      fontWeight: typography.weightMedium,
      lineHeight: typography.sizeXs * 1.2,
    }}
  >
    {children}
  </Text>
);
