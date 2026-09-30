// Reanimated needs a native runtime. Unit tests only care about structure, so
// animations resolve instantly to their target values.
jest.mock('react-native-reanimated', () => {
  const { View, Text, Image, ScrollView } = require('react-native');
  const passthrough = (value) => value;
  const entering = { duration: () => entering, delay: () => entering, springify: () => entering, damping: () => entering };
  return {
    __esModule: true,
    default: { View, Text, Image, ScrollView, createAnimatedComponent: (c) => c },
    useSharedValue: (value) => ({ value }),
    useAnimatedStyle: (factory) => factory(),
    useAnimatedProps: (factory) => factory(),
    withTiming: passthrough,
    withSpring: passthrough,
    withDelay: (_delay, value) => value,
    withRepeat: passthrough,
    withSequence: (...values) => values[values.length - 1],
    cancelAnimation: () => undefined,
    interpolate: (value) => value,
    Extrapolation: { CLAMP: 'clamp', EXTEND: 'extend', IDENTITY: 'identity' },
    Easing: new Proxy({}, { get: () => () => () => 0 }),
    FadeIn: entering,
    FadeOut: entering,
    FadeInDown: entering,
    FadeInUp: entering,
    FadeInLeft: entering,
    ZoomIn: entering,
  };
});

jest.mock('@react-native-clipboard/clipboard', () => ({
  __esModule: true,
  default: { setString: jest.fn(), getString: jest.fn(async () => '') },
}));
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const inset = { top: 0, right: 0, bottom: 0, left: 0 };
  return {
    SafeAreaProvider: ({ children }) => children,
    SafeAreaView: ({ children }) => React.createElement(React.Fragment, null, children),
    useSafeAreaInsets: () => inset,
    useSafeAreaFrame: () => ({ x: 0, y: 0, width: 390, height: 844 }),
    SafeAreaInsetsContext: React.createContext(inset),
    initialWindowMetrics: { insets: inset, frame: { x: 0, y: 0, width: 390, height: 844 } },
  };
});
