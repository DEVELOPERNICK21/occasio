import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import { BackHandler, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnalyticsEvents, trackEvent } from '../../../../shared/analytics/events';
import { triggerCardHaptic } from '../../../../shared/platform/haptics';
import type { RootStackParamList } from '../../../../shared/navigation/types';
import { Button } from '../../../../shared/ui/Button';
import { Text } from '../../../../shared/ui/Text';
import { colors, spacing, typography } from '../../../../shared/theme/tokens';
import { AUDIENCE_OPTIONS } from '../../../create/domain/audienceOccasion';
import { setPendingOnboardingIntent } from '../../application/onboardingHandoff';
import { useOnboardingFlow } from '../../application/useOnboardingFlow';
import { useOnboardingPlans } from '../../application/useOnboardingPlans';
import {
  continueLabel,
  intentFrom,
  ONBOARDING_STEPS,
  pipSays,
  stepCopy,
  trustLine,
} from '../../domain/onboardingFlow';
import { AudienceChoiceTile } from '../components/AudienceChoiceTile';
import { DateStep } from '../components/DateStep';
import { DreamStep } from '../components/DreamStep';
import { FearStep } from '../components/FearStep';
import { OfferStep } from '../components/OfferStep';
import { OnboardingHeader } from '../components/OnboardingHeader';
import { OnboardingTrustStrip } from '../components/OnboardingTrustStrip';
import { PipSays } from '../components/PipSays';
import { ReadyStep } from '../components/ReadyStep';
import { type BackdropTone, StepBackdrop } from '../components/StepBackdrop';
import { HEADLINE_FONT } from '../onboardingStyle';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'> & {
  onComplete: () => Promise<void>;
};

export function OnboardingScreen({ navigation, onComplete }: Props) {
  const insets = useSafeAreaInsets();
  const flow = useOnboardingFlow();
  const plan = useOnboardingPlans(flow.step === 'offer');
  const [finishing, setFinishing] = useState(false);

  const finish = useCallback(
    async (outcome: 'completed' | 'skipped') => {
      if (finishing) {
        return;
      }
      setFinishing(true);
      const intent = outcome === 'completed' ? intentFrom(flow.answers) : null;
      setPendingOnboardingIntent(intent);
      if (outcome === 'completed') {
        trackEvent(AnalyticsEvents.onboardingCompleted, {
          steps: ONBOARDING_STEPS.length,
          plan: plan.isPaid ? 'pro' : 'free',
          hasIntent: intent !== null,
          hasDate: flow.daysUntil !== null,
        });
      } else {
        trackEvent(AnalyticsEvents.onboardingSkipped, {
          atSlide: flow.index + 1,
          step: flow.step,
        });
      }
      try {
        await onComplete();
        navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
      } catch {
        setFinishing(false);
      }
    },
    [finishing, flow.answers, flow.daysUntil, flow.index, flow.step, navigation, onComplete, plan.isPaid],
  );

  const goBack = useCallback(() => {
    triggerCardHaptic();
    flow.back();
  }, [flow]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (flow.isFirst) {
        return false;
      }
      flow.back();
      return true;
    });
    return () => sub.remove();
  }, [flow]);

  const onPrimary = () => {
    triggerCardHaptic();
    if (flow.isLast) {
      void finish('completed');
      return;
    }
    if (flow.step === 'fear') {
      flow.pledge();
      return;
    }
    flow.next();
  };

  const copy = stepCopy(flow.step, flow.answers);
  const says = pipSays(flow.step);
  const tone: BackdropTone = flow.step === 'dream' ? 'warm' : flow.step === 'fear' ? 'tender' : 'calm';

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StepBackdrop tone={tone} />
      <OnboardingHeader
        index={flow.index}
        total={flow.total}
        onBack={flow.isFirst ? undefined : goBack}
        onSkip={() => void finish('skipped')}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View key={flow.step} entering={FadeInDown.duration(300)} style={styles.step}>
          {says ? (
            <PipSays
              line={says}
              mood={flow.step === 'offer' ? 'joy' : flow.step === 'ready' ? 'wink' : 'hopeful'}
            />
          ) : null}

          <View style={styles.heading}>
            <Text style={styles.title} accessibilityRole="header">
              {copy.title}
            </Text>
            <Text style={styles.body}>{copy.body}</Text>
          </View>

          {flow.step === 'who' ? (
            <View style={styles.grid} accessibilityRole="radiogroup">
              {AUDIENCE_OPTIONS.map((option, index) => (
                <AudienceChoiceTile
                  key={option.id}
                  audience={option.id}
                  label={option.label}
                  cue={option.cue}
                  index={index}
                  selected={flow.answers.audience === option.id}
                  onPress={() => {
                    triggerCardHaptic();
                    flow.chooseAudience(option.id);
                  }}
                />
              ))}
            </View>
          ) : null}

          {flow.step === 'when' ? (
            <DateStep
              occasion={flow.answers.occasion}
              dateText={flow.answers.dateText}
              onOccasion={(occasion) => {
                triggerCardHaptic();
                flow.chooseOccasion(occasion);
              }}
              onDate={flow.chooseDate}
              onSkip={flow.skipDate}
            />
          ) : null}

          {flow.step === 'dream' ? (
            <View style={styles.hero}>
              <DreamStep
                audience={flow.answers.audience}
                occasion={flow.answers.occasion}
                onOpen={flow.openGift}
              />
            </View>
          ) : null}

          {flow.step === 'fear' ? (
            <View style={styles.hero}>
              <FearStep
                audience={flow.answers.audience}
                occasion={flow.answers.occasion}
                daysUntil={flow.daysUntil}
              />
            </View>
          ) : null}

          {flow.step === 'ready' ? <ReadyStep daysUntil={flow.daysUntil} /> : null}

          {flow.step === 'offer' ? (
            <OfferStep
              audience={flow.answers.audience}
              occasion={flow.answers.occasion}
              daysUntil={flow.daysUntil}
              plans={plan.plans}
              canBuy={plan.canBuy}
              isLoading={plan.isLoading}
              isPaid={plan.isPaid}
              isPurchasing={plan.isPurchasing}
              error={plan.error}
              onBuy={(selected) => void plan.buy(selected)}
              onRestore={() => void plan.restore()}
            />
          ) : null}
        </Animated.View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <Button
          label={continueLabel(flow.step, plan.isPaid)}
          variant={flow.isLast && !plan.isPaid ? 'secondary' : 'primary'}
          disabled={!flow.canContinue || finishing}
          loading={finishing}
          onPress={onPrimary}
          style={styles.cta}
        />
        <OnboardingTrustStrip text={trustLine(flow.step)} slideKey={flow.index} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.lg },
  step: { flexGrow: 1, gap: spacing.lg },
  // The mascot steps: Pip sits in the middle of the room left under the headline.
  hero: { flex: 1, justifyContent: 'center' },
  heading: { gap: spacing.sm },
  title: {
    fontSize: 30,
    lineHeight: 36,
    fontFamily: HEADLINE_FONT,
    fontWeight: '700',
    color: colors.ink,
  },
  body: {
    fontSize: typography.sizeMd,
    lineHeight: typography.sizeMd * 1.45,
    color: colors.inkSoft,
  },
  // Two tiles a row: widths are 48%, so the row gap is vertical only (a horizontal gap would push the second tile onto the next row).
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: spacing.md, justifyContent: 'space-between' },
  footer: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, gap: spacing.sm },
  cta: { width: '100%' },
});
