import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Image,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { env } from '../../../../shared/config/env';
import {
  MAX_PHOTOS_BASE64,
  MAX_PHOTOS_STORAGE,
} from '../../../../shared/config/media';
import { AnalyticsEvents, trackEvent } from '../../../../shared/analytics/events';
import { Text } from '../../../../shared/ui/Text';
import { usePhotoPicker } from '../../application/usePhotoPicker';
import { useCreateDraftContext } from '../../application/CreateDraftContext';
import type { CreateStackParamList } from '../../../../shared/navigation/types';
import { Screen } from '../../../../shared/ui/Screen';
import { ScreenHeaderAction } from '../../../../shared/ui/ScreenHeaderAction';
import { colors, radius, spacing, typography } from '../../../../shared/theme/tokens';

type Props = NativeStackScreenProps<CreateStackParamList, 'AddPhotos'>;

const maxPhotos = env.useBase64Media ? MAX_PHOTOS_BASE64 : MAX_PHOTOS_STORAGE;
const CREATE_STEPS = 4;

export function AddPhotosScreen({ navigation }: Props) {
  const { draft, setPhotoUris } = useCreateDraftContext();
  const { pickPhoto, picking } = usePhotoPicker();

  const handlePick = async (slotIndex: number) => {
    const uri = await pickPhoto();
    if (!uri) return;

    const next = [...draft.photoUris];
    next[slotIndex] = uri;
      setPhotoUris(next.filter(Boolean).slice(0, maxPhotos));
      trackEvent(AnalyticsEvents.photosAdded, { count: next.filter(Boolean).length });
  };

  const removePhoto = (slotIndex: number) => {
    const next = draft.photoUris.filter((_, i) => i !== slotIndex);
    setPhotoUris(next);
  };

  const slots = Array.from({ length: maxPhotos }, (_, i) => i);
  const filledCount = draft.photoUris.filter(Boolean).length;

  return (
    <Screen
      title="Photos"
      subtitle={
        env.useBase64Media ? 'Add 1 photo' : `Add 1–${maxPhotos} photos`
      }
      step={{ current: 2, total: CREATE_STEPS }}
      headerAction={
        <ScreenHeaderAction
          label="Next"
          disabled={draft.photoUris.length < 1 || picking}
          onPress={() => navigation.navigate('Details')}
        />
      }
    >
      <View style={styles.row}>
        {slots.map((i) => {
          const uri = draft.photoUris[i];
          return (
            <PhotoSlot
              key={i}
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
      <Text style={styles.hint}>
        {env.useBase64Media
          ? 'Pick from gallery or take a photo. One compressed image is saved with your card.'
          : 'Pick from gallery or camera. Photos upload when you share.'}
      </Text>
    </Screen>
  );
}

function PhotoSlot({
  uri,
  disabled,
  onPick,
  onRemove,
}: {
  uri?: string;
  disabled: boolean;
  onPick: () => void;
  onRemove?: () => void;
}) {
  return (
    <View style={styles.slotWrap}>
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
    gap: spacing.md,
    marginTop: spacing.md,
  },
  slotWrap: {
    flex: 1,
    position: 'relative',
  },
  slot: {
    aspectRatio: 1,
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
  hint: {
    marginTop: spacing.sm,
    fontSize: typography.sizeSm,
    color: colors.muted,
    lineHeight: typography.sizeSm * 1.4,
  },
});
