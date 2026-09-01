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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnalyticsEvents, trackEvent } from '../../../../shared/analytics/events';
import type { RootStackParamList } from '../../../../shared/navigation/types';
import { Button } from '../../../../shared/ui/Button';
import { Text } from '../../../../shared/ui/Text';
import { colors, spacing, typography } from '../../../../shared/theme/tokens';
import { getOnboardingCtaLabel } from '../../domain/onboardingFlow';
import { ONBOARDING_SLIDES } from '../../domain/onboardingSlides';
import { OnboardingPagerDots } from '../components/OnboardingPagerDots';
import { OnboardingSlideVisual } from '../components/OnboardingSlideVisual';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'> & {
  onComplete: () => Promise<void>;
};

type SlideItem = (typeof ONBOARDING_SLIDES)[number];

export function OnboardingScreen({ navigation, onComplete }: Props) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const listRef = useRef<FlatList<SlideItem>>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    trackEvent(AnalyticsEvents.onboardingStarted);
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
    ({ item }: { item: SlideItem }) => (
      <View style={[styles.slide, { width }]}>
        <View style={styles.visual}>
          <OnboardingSlideVisual slideId={item.id} />
        </View>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.body}>{item.body}</Text>
      </View>
    ),
    [width],
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
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
        <Button
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
    alignItems: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
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
    paddingTop: spacing.xl,
    justifyContent: 'flex-start',
  },
  visual: {
    minHeight: 280,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing['2xl'],
  },
  title: {
    fontSize: typography.size2xl,
    lineHeight: typography.size2xl * 1.12,
    letterSpacing: -0.6,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
    marginBottom: spacing.md,
  },
  body: {
    fontSize: typography.sizeMd,
    lineHeight: typography.sizeMd * 1.45,
    color: colors.muted,
    maxWidth: 340,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.lg,
  },
  cta: {
    width: '100%',
  },
});
