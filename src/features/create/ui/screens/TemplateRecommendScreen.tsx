import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useMemo } from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { AnalyticsEvents, trackEvent } from '../../../../shared/analytics/events';
import { env } from '../../../../shared/config/env';
import {
  MAX_PHOTOS_BASE64,
  MAX_PHOTOS_STORAGE,
} from '../../../../shared/config/media';
import type { CreateStackParamList } from '../../../../shared/navigation/types';
import { colors, spacing, typography } from '../../../../shared/theme/tokens';
import { Screen } from '../../../../shared/ui/Screen';
import { Text } from '../../../../shared/ui/Text';
import { useCreateDraftContext } from '../../application/CreateDraftContext';
import { useTemplateCatalog } from '../../application/useTemplateCatalog';
import { occasionHeadline } from '../../domain/audienceOccasion';
import { recommendTemplates } from '../../domain/recommendTemplates';
import type { TemplateDefinition } from '../../domain/templateSchema';
import { getTemplateTheme } from '../../domain/templateTheme';
import type { TemplateType } from '../../domain/types';
import { DesignFrameCard } from '../components/DesignFrameCard';
import { getCreateStep } from '../createSteps';

type Props = NativeStackScreenProps<CreateStackParamList, 'TemplateRecommend'>;

const environmentMaxPhotos = env.useBase64Media
  ? MAX_PHOTOS_BASE64
  : MAX_PHOTOS_STORAGE;

/** What the frame does, not what the card says — the words come from you. */
const TEMPLATE_CUES: Record<string, string> = {
  B01: 'Classic and calm',
  B04: 'Two photos, side by side',
  B10: 'Their photo, nothing else',
  L06: 'Warm and personal',
  T01: 'Simple and sincere',
};

const STYLE_TONES: Record<
  TemplateDefinition['style'],
  { wash: string; photo: string; photoAlt: string; accent: string; ink: string }
> = {
  elegant: {
    wash: '#FCEEE8',
    photo: '#E8A4A0',
    photoAlt: '#F7C9B6',
    accent: '#C94E4A',
    ink: colors.ink,
  },
  emotional: {
    wash: '#FAE8E8',
    photo: '#E8615D',
    photoAlt: '#F6A94A',
    accent: '#E8615D',
    ink: colors.ink,
  },
  minimal: {
    wash: '#F5EDEA',
    photo: '#B07A6F',
    photoAlt: '#D4B8B0',
    accent: '#857371',
    ink: colors.ink,
  },
};

export function TemplateRecommendScreen({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const { draft, setTemplateId } = useCreateDraftContext();
  const { templates } = useTemplateCatalog();

  const occasionTheme = useMemo(() => {
    const occasion = draft.occasion;
    if (!occasion) return getTemplateTheme('birthday');
    return getTemplateTheme(occasion as TemplateType);
  }, [draft.occasion]);

  const photoCount = draft.photoUris.filter(Boolean).length;

  const recommended = useMemo(() => {
    if (!draft.audience || !draft.occasion) return [];
    return recommendTemplates({
      audience: draft.audience,
      occasion: draft.occasion,
      catalog: templates,
      // Frames needing more photos than the user added would render empty slots.
      maxPhotosAllowed: Math.min(
        environmentMaxPhotos,
        photoCount || environmentMaxPhotos,
      ),
    });
  }, [draft.audience, draft.occasion, photoCount, templates]);

  useEffect(() => {
    if (!draft.audience || !draft.occasion) {
      navigation.replace('CreateHome');
    }
  }, [draft.audience, draft.occasion, navigation]);

  const selectTemplate = (templateId: string) => {
    setTemplateId(templateId);
    trackEvent(AnalyticsEvents.templateSelected, { templateId });
    navigation.navigate('Details');
  };

  const headline = occasionHeadline(draft.occasion) ?? 'Your words';
  const cardWidth = (width - spacing.lg * 2 - spacing.sm) / 2;

  return (
    <Screen
      title="Choose a frame"
      subtitle="Same photo, same words — only the arrangement changes."
      step={getCreateStep('frame', false)}
      onBack={() => navigation.goBack()}
      scroll={false}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {recommended.length === 0 ? (
          <Text style={styles.empty}>
            No designs matched. Go back and pick who this is for.
          </Text>
        ) : (
          <View style={styles.grid}>
            {recommended.map((template, index) => {
              const baseTone = STYLE_TONES[template.style];
              const tone = {
                ...baseTone,
                accent: occasionTheme.accent,
                wash: occasionTheme.softBackground,
                photo: occasionTheme.orbPrimary,
                photoAlt: occasionTheme.orbSecondary,
              };
              return (
                <DesignFrameCard
                  key={template.id}
                  template={template}
                  cue={TEMPLATE_CUES[template.id] ?? occasionTheme.emotionalCue}
                  headline={headline}
                  photoUris={draft.photoUris}
                  tone={tone}
                  width={cardWidth}
                  recommended={index === 0 && recommended.length > 1}
                  onPress={() => selectTemplate(template.id)}
                />
              );
            })}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: spacing['2xl'],
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  empty: {
    marginTop: spacing.lg,
    fontSize: typography.sizeSm,
    color: colors.inkSoft,
  },
});
