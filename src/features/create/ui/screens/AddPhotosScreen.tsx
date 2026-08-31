import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../../../shared/ui/Text';
import { useCreateDraftContext } from '../../application/CreateDraftContext';
import type { CreateStackParamList } from '../../../../shared/navigation/types';
import { Button } from '../../../../shared/ui/Button';
import { Screen } from '../../../../shared/ui/Screen';
import { colors, radius, spacing, typography } from '../../../../shared/theme/tokens';

type Props = NativeStackScreenProps<CreateStackParamList, 'AddPhotos'>;

export function AddPhotosScreen({ navigation }: Props) {
  const { draft, setPhotoUris } = useCreateDraftContext();

  const addPlaceholderPhoto = () => {
    if (draft.photoUris.length >= 3) return;
    setPhotoUris([
      ...draft.photoUris,
      `placeholder://${draft.photoUris.length + 1}`,
    ]);
  };

  const slots = [0, 1, 2];

  return (
    <Screen
      title="Photos"
      subtitle="Add 1–3 photos"
      footer={
        <Button
          label="Next"
          disabled={draft.photoUris.length < 1}
          onPress={() => navigation.navigate('Details')}
        />
      }
    >
      <View style={styles.row}>
        {slots.map((i) => {
          const filled = draft.photoUris[i];
          return (
            <PressableSlot
              key={i}
              filled={Boolean(filled)}
              onPress={addPlaceholderPhoto}
            />
          );
        })}
      </View>
      <Text style={styles.hint}>
        Phase 4: wire image picker + upload. Placeholder tap adds a slot for now.
      </Text>
    </Screen>
  );
}

function PressableSlot({
  filled,
  onPress,
}: {
  filled: boolean;
  onPress: () => void;
}) {
  return (
    <Text onPress={onPress} style={[styles.slot, filled && styles.slotFilled]}>
      {filled ? 'Photo' : '+'}
    </Text>
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
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: typography.sizeLg,
    color: colors.muted,
    lineHeight: 100,
  },
  slotFilled: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
    color: colors.accent,
  },
  hint: {
    marginTop: spacing.lg,
    fontSize: typography.sizeSm,
    color: colors.muted,
  },
});
