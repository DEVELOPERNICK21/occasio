import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { triggerTabHaptic } from '../platform/haptics';
import { Text } from '../ui/Text';
import {
  AccountTabIcon,
  CreateTabIcon,
  HistoryTabIcon,
  VaultTabIcon,
} from '../ui/icons/TabIcons';
import { colors, radius, shadow, spacing, typography } from '../theme/tokens';
import { TAB_BAR_LAYOUT } from './tabBarConstants';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedText = Animated.createAnimatedComponent(Text);

const {
  barHeight: BAR_HEIGHT,
  bubbleLift: BUBBLE_LIFT,
  bottomGap: BAR_BOTTOM_GAP,
  bubbleSize: BUBBLE_SIZE,
  horizontalMargin: BAR_HORIZONTAL_MARGIN,
  iconSize: ICON_SIZE,
} = TAB_BAR_LAYOUT;

type TabRouteName = 'CreateTab' | 'VaultTab' | 'HistoryTab' | 'AccountTab';

const TAB_CONFIG: Record<
  TabRouteName,
  { label: string; Icon: typeof CreateTabIcon }
> = {
  CreateTab: { label: 'Create', Icon: CreateTabIcon },
  VaultTab: { label: 'Vault', Icon: VaultTabIcon },
  HistoryTab: { label: 'History', Icon: HistoryTabIcon },
  AccountTab: { label: 'Account', Icon: AccountTabIcon },
};

const SPRING = {
  damping: 19,
  stiffness: 220,
  mass: 0.8,
};

const PRESS_SPRING = {
  damping: 14,
  stiffness: 420,
  mass: 0.6,
};

const BAR_CORNER_RADIUS = 24;

/** Smooth U-notch with horizontal tangents at the shoulders (no arc kinks). */
function buildTabBarPath(width: number, height: number, centerX: number): string {
  'worklet';
  const corner = BAR_CORNER_RADIUS;
  const notchHalfWidth = 34;
  const notchDepth = 26;
  const shoulderEase = 22;

  const leftShoulder = Math.max(corner + 6, centerX - notchHalfWidth - shoulderEase);
  const rightShoulder = Math.min(
    width - corner - 6,
    centerX + notchHalfWidth + shoulderEase,
  );

  const cpSpread = 18;

  return [
    `M ${corner} 0`,
    `H ${leftShoulder}`,
    `C ${leftShoulder + shoulderEase} 0 ${centerX - cpSpread} ${notchDepth} ${centerX} ${notchDepth}`,
    `C ${centerX + cpSpread} ${notchDepth} ${rightShoulder - shoulderEase} 0 ${rightShoulder} 0`,
    `H ${width - corner}`,
    `Q ${width} 0 ${width} ${corner}`,
    `V ${height - corner}`,
    `Q ${width} ${height} ${width - corner} ${height}`,
    `H ${corner}`,
    `Q 0 ${height} 0 ${height - corner}`,
    `V ${corner}`,
    `Q 0 0 ${corner} 0`,
    'Z',
  ].join(' ');
}

type BubbleIconLayerProps = {
  index: number;
  activeIndex: number;
  Icon: typeof CreateTabIcon;
};

function BubbleIconLayer({ index, activeIndex, Icon }: BubbleIconLayerProps) {
  const opacity = useSharedValue(activeIndex === index ? 1 : 0);
  const scale = useSharedValue(activeIndex === index ? 1 : 0.86);

  useEffect(() => {
    const active = activeIndex === index;
    opacity.value = withTiming(active ? 1 : 0, { duration: 200 });
    scale.value = withSpring(active ? 1 : 0.86, SPRING);
  }, [activeIndex, index, opacity, scale]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.bubbleIconLayer, style]} pointerEvents="none">
      <Icon size={ICON_SIZE} color={colors.white} active />
    </Animated.View>
  );
}

type TabBarLabelProps = {
  focused: boolean;
  label: string;
};

function TabBarLabel({ focused, label }: TabBarLabelProps) {
  const opacity = useSharedValue(focused ? 1 : 0.62);
  const translateY = useSharedValue(focused ? 0 : 2);

  useEffect(() => {
    opacity.value = withTiming(focused ? 1 : 0.62, { duration: 180 });
    translateY.value = withSpring(focused ? 0 : 2, {
      damping: 22,
      stiffness: 280,
      mass: 0.7,
    });
  }, [focused, opacity, translateY]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <AnimatedText
      style={[
        styles.label,
        focused ? styles.labelActive : styles.labelInactive,
        style,
      ]}
    >
      {label}
    </AnimatedText>
  );
}

export function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const [barWidth, setBarWidth] = useState(0);
  const barWidthShared = useSharedValue(0);
  const tabCount = state.routes.length;
  const tabWidth = barWidth > 0 ? barWidth / tabCount : 0;
  const centerX = useSharedValue(0);
  const bubbleScale = useSharedValue(1);

  const pulseBubble = () => {
    bubbleScale.value = withSequence(
      withSpring(0.9, PRESS_SPRING),
      withSpring(1, SPRING),
    );
  };

  useEffect(() => {
    if (tabWidth <= 0) return;
    centerX.value = withSpring(state.index * tabWidth + tabWidth / 2, SPRING);
  }, [centerX, state.index, tabWidth]);

  const animatedBarProps = useAnimatedProps(() => ({
    d: buildTabBarPath(barWidthShared.value, BAR_HEIGHT, centerX.value),
  }));

  const bubbleStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: centerX.value - BUBBLE_SIZE / 2 },
      { translateY: -BUBBLE_LIFT },
      { scale: bubbleScale.value },
    ],
  }));

  return (
    <View
      pointerEvents="box-none"
      style={[styles.root, { paddingBottom: insets.bottom + BAR_BOTTOM_GAP }]}
    >
      <View
        style={styles.barShell}
        onLayout={(event) => {
          const width = event.nativeEvent.layout.width;
          setBarWidth(width);
          barWidthShared.value = width;
          const nextTabWidth = width / tabCount;
          centerX.value = state.index * nextTabWidth + nextTabWidth / 2;
        }}
      >
        <View style={styles.barShadow}>
          <Svg width={barWidth || 1} height={BAR_HEIGHT}>
            {barWidth > 0 ? (
              <AnimatedPath
                animatedProps={animatedBarProps}
                fill={colors.surface}
              />
            ) : null}
          </Svg>
        </View>

        <Animated.View style={[styles.bubble, bubbleStyle]}>
          <View style={styles.bubbleRing} />
          {state.routes.map((route, index) => {
            const config = TAB_CONFIG[route.name as TabRouteName];
            return (
              <BubbleIconLayer
                key={route.key}
                index={index}
                activeIndex={state.index}
                Icon={config.Icon}
              />
            );
          })}
        </Animated.View>

        <View style={styles.tabsRow}>
          {state.routes.map((route, index) => {
            const focused = state.index === index;
            const config = TAB_CONFIG[route.name as TabRouteName];
            const Icon = config.Icon;

            const onPress = () => {
              triggerTabHaptic();
              pulseBubble();

              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!focused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            };

            return (
              <Pressable
                key={route.key}
                accessibilityRole="button"
                accessibilityState={{ selected: focused }}
                accessibilityLabel={config.label}
                onPress={onPress}
                onLongPress={() => {
                  navigation.emit({
                    type: 'tabLongPress',
                    target: route.key,
                  });
                }}
                android_ripple={{ color: colors.accentSoft, borderless: true }}
                style={styles.tab}
              >
                <View style={[styles.iconSlot, focused && styles.iconSlotActive]}>
                  {!focused ? (
                    <Icon size={ICON_SIZE} color={colors.muted} />
                  ) : (
                    <View style={styles.iconSpacer} />
                  )}
                </View>
                <TabBarLabel focused={focused} label={config.label} />
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    left: BAR_HORIZONTAL_MARGIN,
    right: BAR_HORIZONTAL_MARGIN,
    bottom: 0,
  },
  barShell: {
    minHeight: BAR_HEIGHT + BUBBLE_LIFT,
    justifyContent: 'flex-end',
  },
  barShadow: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: BAR_HEIGHT,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadow.card,
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 10,
  },
  bubble: {
    position: 'absolute',
    bottom: BAR_HEIGHT - 6,
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: BUBBLE_SIZE / 2,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
    ...shadow.card,
    shadowColor: colors.accent,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 12,
  },
  bubbleRing: {
    ...StyleSheet.absoluteFill,
    borderRadius: BUBBLE_SIZE / 2,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  bubbleIconLayer: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsRow: {
    flexDirection: 'row',
    height: BAR_HEIGHT,
    alignItems: 'flex-end',
    paddingBottom: spacing.sm,
    zIndex: 2,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    minHeight: 48,
    gap: spacing.xs,
  },
  iconSlot: {
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconSlotActive: {
    height: 10,
  },
  iconSpacer: {
    width: 1,
    height: 1,
  },
  label: {
    fontSize: typography.sizeXs,
    lineHeight: typography.sizeXs * 1.25,
  },
  labelActive: {
    color: colors.accent,
    fontWeight: typography.weightSemibold,
  },
  labelInactive: {
    color: colors.muted,
    fontWeight: typography.weightMedium,
  },
});
