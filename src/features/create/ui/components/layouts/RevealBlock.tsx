import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { type AnimatedStyle } from 'react-native-reanimated';

type Props = {
  style?: StyleProp<ViewStyle>;
  animatedStyle: AnimatedStyle<ViewStyle>;
  children: ReactNode;
};

/** Thin wrapper so layouts can stage opacity / rise without repeating boilerplate. */
export function RevealBlock({ style, animatedStyle, children }: Props) {
  return (
    <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
  );
}
