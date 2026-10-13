import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { triggerTabHaptic } from '../platform/haptics';
import { useReduceMotion } from '../platform/useReduceMotion';
import { Text } from '../ui/Text';
import {
  AccountTabIcon,
  CreateTabIcon,
  HistoryTabIcon,
  TAB_ICON_INACTIVE,
  VaultTabIcon,
} from '../ui/icons/TabIcons';
import { colors, radius, shadow, typography } from '../theme/tokens';
import { FLOATING_TAB_BAR_HEIGHT, TAB_BAR_LAYOUT } from './tabBarConstants';
import { pillSlot, tabSlot } from './tabBarGeometry';

/** Height of the soft fade where scrolling content meets the tab bar zone. */
const CONTENT_FADE_HEIGHT = 36;

/**
 * Screens end exactly where the bar zone begins, so content would otherwise stop
 * on a hard line. This eases it into the page colour instead.
 */
function ContentFade() {
  return (
    <View pointerEvents="none" style={styles.contentFade}>
      <Svg width="100%" height={CONTENT_FADE_HEIGHT}>
        <Defs>
          <LinearGradient id="tabContentFade" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.bg} stopOpacity={0} />
            <Stop offset="1" stopColor={colors.bg} stopOpacity={1} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#tabContentFade)" />
      </Svg>
    </View>
  );
}

const {
  barHeight: BAR_HEIGHT,
  bottomGap: BAR_BOTTOM_GAP,
  horizontalMargin: BAR_HORIZONTAL_MARGIN,
  trackPadding: TRACK_PADDING,
  pillHeight: PILL_HEIGHT,
  iconSize: ICON_SIZE,
  pillPadding: PILL_PADDING,
  iconNameGap: ICON_NAME_GAP,
} = TAB_BAR_LAYOUT;

type TabRouteName = 'CreateTab' | 'VaultTab' | 'HistoryTab' | 'AccountTab';

const TAB_CONFIG: Record<TabRouteName, { label: string; Icon: typeof CreateTabIcon }> = {
  CreateTab: { label: 'Create', Icon: CreateTabIcon },
  VaultTab: { label: 'Vault', Icon: VaultTabIcon },
  HistoryTab: { label: 'History', Icon: HistoryTabIcon },
  AccountTab: { label: 'Account', Icon: AccountTabIcon },
};

const SPRING = { damping: 17, stiffness: 230, mass: 0.8 };
const PRESS_SPRING = { damping: 14, stiffness: 420, mass: 0.6 };
/** The icon is this far down the bar's height so it sits level with the name. */
const ICON_TOP = (BAR_HEIGHT - 2 - ICON_SIZE) / 2;

type TabItemProps = {
  index: number;
  count: number;
  pos: SharedValue<number>;
  inner: SharedValue<number>;
  focused: boolean;
  label: string;
  Icon: typeof CreateTabIcon;
  badge?: number;
  accessibilityLabel: string;
  onPress: () => void;
  onLongPress: () => void;
};

/**
 * One tab. Its width, its icon and the fade of its name all come from where the
 * pill is (`pos`), so the tab opens up as the pill arrives and closes as it leaves.
 */
function TabItem({
  index,
  count,
  pos,
  inner,
  focused,
  label,
  Icon,
  badge,
  accessibilityLabel,
  onPress,
  onLongPress,
}: TabItemProps) {
  const press = useSharedValue(1);
  const pop = useSharedValue(focused ? 1 : 0.75);

  useEffect(() => {
    pop.value = focused ? withSpring(1, SPRING) : 0.75;
  }, [focused, pop]);

  const slotStyle = useAnimatedStyle(() => {
    if (inner.value <= 0) return { opacity: 0 };
    const slot = tabSlot(pos.value, index, inner.value, count);
    return { opacity: 1, left: slot.left, width: slot.width, transform: [{ scale: press.value }] };
  });
  // The icon rests in the middle of a narrow tab and moves to the pill's left edge as it widens.
  const iconStyle = useAnimatedStyle(() => {
    if (inner.value <= 0) return {};
    const slot = tabSlot(pos.value, index, inner.value, count);
    const resting = (slot.width - ICON_SIZE) / 2;
    return { left: resting + (PILL_PADDING - resting) * slot.activeness };
  });
  const dimStyle = useAnimatedStyle(() => ({
    opacity: inner.value <= 0 ? 1 : 1 - tabSlot(pos.value, index, inner.value, count).activeness,
  }));
  const litStyle = useAnimatedStyle(() => ({
    opacity: inner.value <= 0 ? 0 : tabSlot(pos.value, index, inner.value, count).activeness,
    transform: [{ scale: pop.value }],
  }));
  // The name fades in only once the pill is mostly there, so it never squeezes into a narrow tab.
  const nameStyle = useAnimatedStyle(() => {
    const activeness = inner.value <= 0 ? 0 : tabSlot(pos.value, index, inner.value, count).activeness;
    return { opacity: Math.max(0, (activeness - 0.55) / 0.45) };
  });

  return (
    <Animated.View style={[styles.slot, slotStyle]}>
      <Pressable
        accessibilityRole="tab"
        accessibilityState={{ selected: focused }}
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        onPressIn={() => {
          press.value = withSpring(0.94, PRESS_SPRING);
        }}
        onPressOut={() => {
          press.value = withSpring(1, SPRING);
        }}
        onLongPress={onLongPress}
        android_ripple={{ color: colors.accentSoft }}
        style={StyleSheet.absoluteFill}
      >
        <Animated.View style={[styles.icon, iconStyle]} pointerEvents="none">
          <Animated.View style={[styles.iconLayer, dimStyle]}>
            <Icon size={ICON_SIZE} color={TAB_ICON_INACTIVE} />
          </Animated.View>
          <Animated.View style={[styles.iconLayer, litStyle]}>
            <Icon size={ICON_SIZE} color={colors.white} active />
          </Animated.View>
          {badge ? (
            <Animated.View style={[styles.badge, dimStyle]}>
              <Text style={styles.badgeText}>{badge > 9 ? '9+' : String(badge)}</Text>
            </Animated.View>
          ) : null}
        </Animated.View>
        <Animated.View style={[styles.nameWrap, nameStyle]} pointerEvents="none">
          <Text numberOfLines={1} style={styles.name}>
            {label}
          </Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

/** What a screen reader says for a tab, with the badge spelled out. */
function tabLabel(label: string, badge?: number): string {
  if (!badge) return label;
  return `${label}, ${badge} coming up this week`;
}

export function FloatingTabBar({ state, navigation, descriptors }: BottomTabBarProps) {
  const focusedRoute = state.routes[state.index];
  const tabBarStyle = descriptors[focusedRoute.key]?.options.tabBarStyle as ViewStyle | undefined;
  const isHidden = StyleSheet.flatten(tabBarStyle)?.display === 'none';

  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();
  const count = state.routes.length;
  // Where the pill is, as a number between tab indexes. It starts on the current tab, not sliding in.
  const pos = useSharedValue(state.index);
  const inner = useSharedValue(0);
  const [, setMeasured] = useState(false);

  useEffect(() => {
    pos.value = reduceMotion ? withTiming(state.index, { duration: 140 }) : withSpring(state.index, SPRING);
  }, [pos, reduceMotion, state.index]);

  const pillStyle = useAnimatedStyle(() => {
    if (inner.value <= 0) return { opacity: 0 };
    const pill = pillSlot(pos.value, inner.value, count);
    return { opacity: 1, left: pill.left, width: pill.width };
  });

  if (isHidden) {
    return null;
  }

  return (
    <View
      pointerEvents="box-none"
      style={[styles.root, { paddingBottom: insets.bottom + BAR_BOTTOM_GAP }]}
    >
      <ContentFade />
      <View style={styles.bar}>
        <View
          style={styles.track}
          onLayout={(event) => {
            inner.value = event.nativeEvent.layout.width;
            setMeasured(true);
          }}
        >
          <Animated.View style={[styles.pill, pillStyle]} pointerEvents="none" />
          <View accessibilityRole="tablist" style={StyleSheet.absoluteFill}>
            {state.routes.map((route, index) => {
              const focused = state.index === index;
              const config = TAB_CONFIG[route.name as TabRouteName];
              const rawBadge = descriptors[route.key]?.options.tabBarBadge;
              const badge = typeof rawBadge === 'number' && rawBadge > 0 ? rawBadge : undefined;

              const onPress = () => {
                triggerTabHaptic();
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
                <TabItem
                  key={route.key}
                  index={index}
                  count={count}
                  pos={pos}
                  inner={inner}
                  focused={focused}
                  label={config.label}
                  Icon={config.Icon}
                  badge={badge}
                  accessibilityLabel={tabLabel(config.label, badge)}
                  onPress={onPress}
                  onLongPress={() => {
                    navigation.emit({ type: 'tabLongPress', target: route.key });
                  }}
                />
              );
            })}
          </View>
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
  contentFade: {
    position: 'absolute',
    // Bleed past the bar's side margins so the fade spans the whole screen width.
    left: -BAR_HORIZONTAL_MARGIN,
    right: -BAR_HORIZONTAL_MARGIN,
    bottom: FLOATING_TAB_BAR_HEIGHT,
    height: CONTENT_FADE_HEIGHT,
  },
  bar: {
    height: BAR_HEIGHT,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: TRACK_PADDING,
    ...shadow.card,
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 10,
  },
  track: {
    flex: 1,
  },
  pill: {
    position: 'absolute',
    top: (BAR_HEIGHT - 2 - PILL_HEIGHT) / 2,
    height: PILL_HEIGHT,
    borderRadius: PILL_HEIGHT / 2,
    backgroundColor: colors.accent,
    shadowColor: colors.accent,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  // Each tab fills the whole bar height, so a tap anywhere on it counts, not just on the icon.
  slot: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    overflow: 'hidden',
    borderRadius: radius.full,
  },
  icon: {
    position: 'absolute',
    top: ICON_TOP,
    width: ICON_SIZE,
    height: ICON_SIZE,
  },
  iconLayer: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameWrap: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: PILL_PADDING + ICON_SIZE + ICON_NAME_GAP,
    justifyContent: 'center',
  },
  name: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightSemibold,
    color: colors.white,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -8,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: colors.accentHover,
    borderWidth: 1.5,
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: typography.weightSemibold,
    color: colors.white,
  },
});
