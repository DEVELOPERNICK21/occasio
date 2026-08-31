import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import {
  launchImageLibrary,
  type ImagePickerResponse,
} from 'react-native-image-picker';
import { env } from '../../../../shared/config/env';
import {
  MAX_PHOTOS_BASE64,
  MAX_PHOTOS_STORAGE,
} from '../../../../shared/config/media';
import { Text } from '../../../../shared/ui/Text';
import { useCreateDraftContext } from '../../application/CreateDraftContext';
import type { CreateStackParamList } from '../../../../shared/navigation/types';
import { Button } from '../../../../shared/ui/Button';
import { Screen } from '../../../../shared/ui/Screen';
import { colors, radius, spacing, typography } from '../../../../shared/theme/tokens';

type Props = NativeStackScreenProps<CreateStackParamList, 'AddPhotos'>;

const maxPhotos = env.useBase64Media ? MAX_PHOTOS_BASE64 : MAX_PHOTOS_STORAGE;

export function AddPhotosScreen({ navigation }: Props) {
  const { draft, setPhotoUris } = useCreateDraftContext();
  const [picking, setPicking] = useState(false);

  const pickPhoto = async (slotIndex: number) => {
    if (picking) return;
    setPicking(true);

    try {
      const result: ImagePickerResponse = await launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: 1,
        quality: env.useBase64Media ? 0.7 : 0.8,
        maxWidth: env.useBase64Media ? 960 : undefined,
        maxHeight: env.useBase64Media ? 960 : undefined,
        includeBase64: env.useBase64Media,
      });

      if (result.didCancel) return;
      if (result.errorCode) {
        Alert.alert('Could not open photos', result.errorMessage ?? result.errorCode);
        return;
      }

      const asset = result.assets?.[0];
      if (!asset?.uri) return;

      const uri =
        env.useBase64Media && asset.base64
          ? `data:image/jpeg;base64,${asset.base64}`
          : asset.uri;

      const next = [...draft.photoUris];
      next[slotIndex] = uri;
      setPhotoUris(next.filter(Boolean).slice(0, maxPhotos));
    } finally {
      setPicking(false);
    }
  };

  const removePhoto = (slotIndex: number) => {
    const next = draft.photoUris.filter((_, i) => i !== slotIndex);
    setPhotoUris(next);
  };

  const slots = Array.from({ length: maxPhotos }, (_, i) => i);

  return (
    <Screen
      title="Photos"
      subtitle={
        env.useBase64Media ? 'Add 1 photo' : `Add 1–${maxPhotos} photos`
      }
      footer={
        <Button
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
              onPick={() => pickPhoto(i)}
              onRemove={uri ? () => removePhoto(i) : undefined}
            />
          );
        })}
      </View>
      <Text style={styles.hint}>
        {env.useBase64Media
          ? 'One compressed photo is saved with your card until Storage is enabled.'
          : 'Tap a slot to choose from your gallery. Photos upload when you share.'}
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
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPick}
      onLongPress={onRemove}
      style={[styles.slot, uri && styles.slotFilled]}
    >
      {uri ? (
        <Image source={{ uri }} style={styles.image} resizeMode="cover" />
      ) : (
        <Text style={styles.plus}>+</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  slot: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  slotFilled: {
    borderColor: colors.accent,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  plus: {
    fontSize: typography.sizeLg,
    color: colors.muted,
  },
  hint: {
    marginTop: spacing.lg,
    fontSize: typography.sizeSm,
    color: colors.muted,
  },
});
