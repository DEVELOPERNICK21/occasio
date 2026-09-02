import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ViewToken,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnalyticsEvents, trackEvent } from '../../../../shared/analytics/events';
import { triggerCardHaptic } from '../../../../shared/platform/haptics';
import type { RootStackParamList } from '../../../../shared/navigation/types';
import { Button } from '../../../../shared/ui/Button';
import { Text } from '../../../../shared/ui/Text';
import { colors, radius, spacing, typography } from '../../../../shared/theme/tokens';
import {
  getOnboardingCtaLabel,
  getOnboardingProgressLabel,
  getOnboardingTrustLine,
} from '../../domain/onboardingFlow';
import { ONBOARDING_SLIDES } from '../../domain/onboardingSlides';
import { OnboardingPagerDots } from '../components/OnboardingPagerDots';
import { OnboardingSlidePanel } from '../components/OnboardingSlidePanel';
import { OnboardingSlideVisual } from '../components/OnboardingSlideVisual';
import { OnboardingTrustStrip } from '../components/OnboardingTrustStrip';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'> & {
  onComplete: () => Promise<void>;
};

type SlideItem = (typeof ONBOARDING_SLIDES)[number];

function OnboardingProgressBar({ activeIndex, total }: { activeIndex: number; total: number }) {
  const progress = useSharedValue((activeIndex + 1) / total);

  useEffect(() => {
    progress.value = withSpring((activeIndex + 1) / total, {
      damping: 20,
      stiffness: 180,
    });
  }, [activeIndex, progress, total]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View style={styles.progressTrack}>
      <Animated.View style={[styles.progressFill, fillStyle]} />
    </View>
  );
}

export function OnboardingScreen({ navigation, onComplete }: Props) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const listRef = useRef<FlatList<SlideItem>>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [replayKeys, setReplayKeys] = useState(() =>
    ONBOARDING_SLIDES.map(() => 0),
  );

  useEffect(() => {
    trackEvent(AnalyticsEvents.onboardingStarted);
  }, []);

  useEffect(() => {
    setReplayKeys((prev) =>
      prev.map((key, index) => (index === activeIndex ? key + 1 : key)),
    );
  }, [activeIndex]);

  const bumpReplay = useCallback((index: number) => {
    triggerCardHaptic();
    setReplayKeys((prev) =>
      prev.map((key, i) => (i === index ? key + 1 : key)),
    );
  }, []);

  const finish = useCallback(async () => {
    trackEvent(AnalyticsEvents.onboardingCompleted, {
      slideCount: ONBOARDING_SLIDES.length,
    });
    await onComplete();
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs' }],
    });
  }, [navigation, onComplete]);

  const skip = useCallback(() => {
    trackEvent(AnalyticsEvents.onboardingSkipped, { atSlide: activeIndex + 1 });
    void finish();
  }, [activeIndex, finish]);

  const advance = useCallback(() => {
    triggerCardHaptic();
    if (activeIndex < ONBOARDING_SLIDES.length - 1) {
      const nextIndex = activeIndex + 1;
      listRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setActiveIndex(nextIndex);
      return;
    }
    void finish();
  }, [activeIndex, finish]);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken<SlideItem>[] }) => {
      const index = viewableItems[0]?.index;
      if (typeof index === 'number') {
        setActiveIndex(index);
      }
    },
  ).current;

  const onMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const index = Math.round(event.nativeEvent.contentOffset.x / width);
      setActiveIndex(index);
    },
    [width],
  );

  const renderSlide = useCallback(
    ({ item, index }: { item: SlideItem; index: number }) => {
      const isActive = index === activeIndex;
      return (
        <View style={[styles.slide, { width }]}>
          <View style={styles.visual}>
            <OnboardingSlideVisual
              slideId={item.id}
              isActive={isActive}
              replayKey={replayKeys[index] ?? 0}
              onReplay={() => bumpReplay(index)}
            />
          </View>
          <OnboardingSlidePanel
            slide={item}
            isActive={isActive}
            replayKey={replayKeys[index] ?? 0}
          />
        </View>
      );
    },
    [activeIndex, bumpReplay, replayKeys, width],
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <View style={styles.topBarMain}>
          <Text style={styles.progress}>{getOnboardingProgressLabel(activeIndex)}</Text>
          <OnboardingProgressBar
            activeIndex={activeIndex}
            total={ONBOARDING_SLIDES.length}
          />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Skip onboarding"
          onPress={skip}
          hitSlop={12}
          style={({ pressed }) => [styles.skip, pressed && styles.skipPressed]}
        >
          <Text style={styles.skipLabel}>Skip</Text>
        </Pressable>
      </View>

      <FlatList
        ref={listRef}
        data={[...ONBOARDING_SLIDES]}
        keyExtractor={(item) => item.id}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
        onMomentumScrollEnd={onMomentumScrollEnd}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
      />

      <View
        style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}
      >
        <OnboardingPagerDots
          count={ONBOARDING_SLIDES.length}
          activeIndex={activeIndex}
        />
        <OnboardingTrustStrip
          text={getOnboardingTrustLine(activeIndex)}
          slideKey={activeIndex}
        />
        <Button
          key={`cta-${activeIndex}`}
          label={getOnboardingCtaLabel(activeIndex)}
          onPress={advance}
          style={styles.cta}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    gap: spacing.md,
  },
  topBarMain: {
    flex: 1,
    gap: spacing.sm,
  },
  progressTrack: {
    height: 3,
    borderRadius: radius.full,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.full,
    backgroundColor: colors.accent,
  },
  progress: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightSemibold,
    color: colors.muted,
    letterSpacing: 0.3,
  },
  skip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  skipPressed: {
    opacity: 0.7,
  },
  skipLabel: {
    fontSize: typography.sizeMd,
    color: colors.muted,
    fontWeight: typography.weightMedium,
  },
  slide: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    justifyContent: 'flex-start',
  },
  visual: {
    minHeight: 280,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  cta: {
    width: '100%',
  },
});
