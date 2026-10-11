import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { Images } from 'lucide-react-native';
import { env } from '../../../../shared/config/env';
import {
  MAX_PHOTOS_BASE64,
  MAX_PHOTOS_STORAGE,
} from '../../../../shared/config/media';
import { AnalyticsEvents, trackEvent } from '../../../../shared/analytics/events';
import { Button } from '../../../../shared/ui/Button';
import { Text } from '../../../../shared/ui/Text';
import { usePhotoPicker } from '../../application/usePhotoPicker';
import { useCreateDraftContext } from '../../application/CreateDraftContext';
import { useTemplateCatalog } from '../../application/useTemplateCatalog';
import { nextUnlock } from '../../domain/recommendTemplates';
import { validatePickedPhoto } from '../../domain/photoValidation';
import type { CreateStackParamList } from '../../../../shared/navigation/types';
import { Screen } from '../../../../shared/ui/Screen';
import { ScreenHeaderAction } from '../../../../shared/ui/ScreenHeaderAction';
import { colors, radius, spacing, typography } from '../../../../shared/theme/tokens';
import { CreateNudge, CreateProgress } from '../components/CreateProgress';

type Props = NativeStackScreenProps<CreateStackParamList, 'AddPhotos'>;

const environmentMaxPhotos = env.useBase64Media
  ? MAX_PHOTOS_BASE64
  : MAX_PHOTOS_STORAGE;
const photoMode = env.useBase64Media ? 'base64' : 'storage';
const TILES_PER_ROW = 3;

export function AddPhotosScreen({ navigation, route }: Props) {
  const { draft, setPhotoUris } = useCreateDraftContext();
  const { pickPhoto, pickPhotos, picking } = usePhotoPicker();
  const [validationError, setValidationError] = useState<string | null>(null);
  const { templates, getById } = useTemplateCatalog();
  const { width } = useWindowDimensions();
  // Three equal tiles per row; a short last row keeps the same tile size.
  const tileWidth = (width - spacing.lg * 2 - spacing.md * (TILES_PER_ROW - 1)) / TILES_PER_ROW;
  // Story photo deck + letter use all picks; frame layouts use 1–5 slots.
  const maxPhotos = environmentMaxPhotos;

  useEffect(() => {
    if (draft.photoUris.length > maxPhotos) {
      setPhotoUris(draft.photoUris.slice(0, maxPhotos));
    }
  }, [draft.photoUris, maxPhotos, setPhotoUris]);

  const handleAddMany = async () => {
    const existing = draft.photoUris.slice(0, maxPhotos).filter(Boolean);
    const remaining = maxPhotos - existing.length;
    const pickedList = await pickPhotos(remaining);
    if (pickedList.length === 0) return;

    const added: string[] = [];
    let firstError: string | null = null;
    for (const picked of pickedList) {
      const validation = validatePickedPhoto({
        uri: picked.uri,
        currentCount: existing.length + added.length,
        mode: photoMode,
        fileSizeBytes: picked.fileSizeBytes,
      });
      if (validation.valid) {
        added.push(picked.uri);
      } else if (!firstError) {
        firstError = validation.message;
      }
    }

    if (firstError) {
      setValidationError(firstError);
      Alert.alert(
        added.length > 0 ? 'Some photos not added' : 'Photo not added',
        firstError,
      );
    } else {
      setValidationError(null);
    }

    if (added.length > 0) {
      const next = [...existing, ...added].slice(0, maxPhotos);
      setPhotoUris(next);
      trackEvent(AnalyticsEvents.photosAdded, { count: next.length });
    }
  };

  const handlePick = async (slotIndex: number) => {
    if (!draft.photoUris[slotIndex]) {
      await handleAddMany();
      return;
    }

    const picked = await pickPhoto();
    if (!picked) return;

    const currentCount = draft.photoUris.slice(0, maxPhotos).filter(Boolean).length;
    const validation = validatePickedPhoto({
      uri: picked.uri,
      currentCount,
      mode: photoMode,
      fileSizeBytes: picked.fileSizeBytes,
      isReplacing: Boolean(draft.photoUris[slotIndex]),
    });

    if (!validation.valid) {
      setValidationError(validation.message);
      Alert.alert('Photo not added', validation.message);
      return;
    }

    setValidationError(null);
    const next = [...draft.photoUris];
    next[slotIndex] = picked.uri;
    setPhotoUris(next.filter(Boolean).slice(0, maxPhotos));
    trackEvent(AnalyticsEvents.photosAdded, {
      count: next.filter(Boolean).slice(0, maxPhotos).length,
    });
  };

  const removePhoto = (slotIndex: number) => {
    const next = draft.photoUris.filter((_, i) => i !== slotIndex);
    setPhotoUris(next);
    setValidationError(null);
  };

  const slots = Array.from({ length: maxPhotos }, (_, i) => i);
  const filledCount = draft.photoUris.slice(0, maxPhotos).filter(Boolean).length;
  const isQuickCreate = !draft.audience;
  // Set when the person picked a frame that needs more photos than they had.
  const forFrameId = route.params?.forFrame;
  const forFrame = forFrameId ? getById(forFrameId) : null;
  const framePhotosShort = forFrame ? Math.max(0, forFrame.photoSlots - filledCount) : 0;
  const unlock = draft.occasion
    ? nextUnlock({
        occasion: draft.occasion,
        catalog: templates,
        photoCount: filledCount,
        maxPhotos,
      })
    : null;

  return (
    <Screen
      title="Photos"
      subtitle={
        forFrame
          ? `${forFrame.title} uses ${forFrame.photoSlots} ${forFrame.photoSlots === 1 ? 'photo' : 'photos'}.`
          : isQuickCreate
            ? 'Add up to 5 photos.'
            : `Add 1–${maxPhotos} photos — you'll pick a frame next.`
      }
      progress={<CreateProgress stage="photos" />}
      onBack={() => navigation.goBack()}
      headerAction={
        <ScreenHeaderAction
          label="Next"
          disabled={draft.photoUris.length < 1 || picking}
          onPress={() => {
            if (forFrame) {
              // Back to the frames with the one they wanted ready to arrange.
              navigation.navigate('TemplateRecommend', { openFrame: forFrame.id });
              return;
            }
            navigation.navigate(draft.templateId ? 'Details' : 'TemplateRecommend');
          }}
        />
      }
    >
      <CreateNudge stage="photos" />
      <View style={styles.row}>
        {slots.map((i) => {
          const uri = draft.photoUris[i];
          return (
            <PhotoSlot
              key={i}
              width={tileWidth}
              uri={uri}
              disabled={picking}
              onPick={() => handlePick(i)}
              onRemove={uri ? () => removePhoto(i) : undefined}
            />
          );
        })}
      </View>
      <Text style={styles.counter}>
        {filledCount} of {maxPhotos} added
      </Text>
      {filledCount < maxPhotos ? (
        <View style={styles.pickAction}>
          <Button
            label={filledCount === 0 ? 'Choose photos' : 'Add more photos'}
            variant={filledCount === 0 ? 'primary' : 'secondary'}
            loading={picking}
            onPress={() => void handleAddMany()}
          />
        </View>
      ) : null}
      {forFrame && framePhotosShort > 0 ? (
        <View style={styles.unlock}>
          <Images size={16} color={colors.accentHover} strokeWidth={2.2} absoluteStrokeWidth />
          <Text style={styles.unlockText}>
            Add {framePhotosShort} more {framePhotosShort === 1 ? 'photo' : 'photos'} to use{' '}
            <Text style={styles.unlockName}>{forFrame.title}</Text>.
          </Text>
        </View>
      ) : unlock && filledCount > 0 ? (
        <View style={styles.unlock}>
          <Images size={16} color={colors.accentHover} strokeWidth={2.2} absoluteStrokeWidth />
          <Text style={styles.unlockText}>
            Add {unlock.photosNeeded} more {unlock.photosNeeded === 1 ? 'photo' : 'photos'} to
            use <Text style={styles.unlockName}>{unlock.template.title}</Text>.
          </Text>
        </View>
      ) : null}
      {validationError ? (
        <Text style={styles.error}>{validationError}</Text>
      ) : null}
      <Text style={styles.hint}>
        {env.useBase64Media
          ? 'Select up to 5 photos at once from your library, or use the camera. Tap a photo to replace and crop it. Extra photos show in the story deck.'
          : 'Select up to 5 photos at once from your library, or use the camera. Tap a photo to replace and crop it. Photos upload when you share.'}
      </Text>
    </Screen>
  );
}

function PhotoSlot({
  width,
  uri,
  disabled,
  onPick,
  onRemove,
}: {
  width: number;
  uri?: string;
  disabled: boolean;
  onPick: () => void;
  onRemove?: () => void;
}) {
  return (
    <View style={[styles.slotWrap, { width }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={uri ? 'Change photo' : 'Add photo'}
        disabled={disabled}
        onPress={onPick}
        style={[styles.slot, uri ? styles.slotFilled : styles.slotEmpty]}
      >
        {uri ? (
          <Image source={{ uri }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.emptyContent}>
            <Text style={styles.plus}>+</Text>
            <Text style={styles.slotLabel}>Add</Text>
          </View>
        )}
      </Pressable>
      {uri && onRemove ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Remove photo"
          disabled={disabled}
          onPress={onRemove}
          style={styles.removeBtn}
          hitSlop={8}
        >
          <Text style={styles.removeLabel}>×</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  slotWrap: {
    position: 'relative',
  },
  slot: {
    aspectRatio: 5 / 4,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  slotEmpty: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
    backgroundColor: colors.sidebar,
  },
  slotFilled: {
    borderWidth: 1,
    borderColor: colors.accent,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  emptyContent: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  plus: {
    fontSize: typography.sizeLg,
    color: colors.accent,
    fontWeight: typography.weightSemibold,
  },
  slotLabel: {
    fontSize: typography.sizeXs,
    color: colors.muted,
    fontWeight: typography.weightMedium,
  },
  removeBtn: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeLabel: {
    color: colors.surface,
    fontSize: typography.sizeMd,
    lineHeight: 20,
    fontWeight: typography.weightSemibold,
  },
  counter: {
    marginTop: spacing.md,
    fontSize: typography.sizeSm,
    fontWeight: typography.weightMedium,
    color: colors.inkSoft,
  },
  pickAction: {
    marginTop: spacing.md,
  },
  unlock: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.sidebar,
    borderWidth: 1,
    borderColor: colors.border,
  },
  unlockText: {
    flex: 1,
    fontSize: typography.sizeSm,
    lineHeight: typography.sizeSm * 1.4,
    color: colors.inkSoft,
  },
  unlockName: {
    fontWeight: typography.weightSemibold,
    color: colors.ink,
  },
  error: {
    marginTop: spacing.xs,
    fontSize: typography.sizeSm,
    color: colors.error,
    lineHeight: typography.sizeSm * 1.4,
  },
  hint: {
    marginTop: spacing.sm,
    fontSize: typography.sizeSm,
    color: colors.muted,
    lineHeight: typography.sizeSm * 1.4,
  },
});
