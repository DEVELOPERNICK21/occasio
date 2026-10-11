import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing, typography } from '../../../../shared/theme/tokens';
import { Button } from '../../../../shared/ui/Button';
import { ModalCloseButton } from '../../../../shared/ui/ModalCloseButton';
import { Text } from '../../../../shared/ui/Text';
import type { TemplateDefinition } from '../../domain/templateSchema';

type Props = {
  template: TemplateDefinition;
  photoCount: number;
  photosNeeded: number;
  onAddPhotos: () => void;
  onClose: () => void;
};

/** Shown when a chosen frame uses more photos than have been added. */
export function NeedMorePhotosSheet({
  template,
  photoCount,
  photosNeeded,
  onAddPhotos,
  onClose,
}: Props) {
  const insets = useSafeAreaInsets();
  const photoWord = (count: number) => (count === 1 ? 'photo' : 'photos');

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable
          style={styles.scrim}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close"
        />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.md }]}>
          <View style={styles.header}>
            <View style={styles.copy}>
              <Text style={styles.title}>
                {`${template.title} uses ${template.photoSlots} ${photoWord(template.photoSlots)}`}
              </Text>
              <Text style={styles.body}>
                {`You have added ${photoCount}. Add ${photosNeeded} more ${photoWord(photosNeeded)} to use this frame. The photos you have stay as they are.`}
              </Text>
            </View>
            <ModalCloseButton onPress={onClose} />
          </View>
          <View style={styles.actions}>
            <Button
              label={`Add ${photosNeeded} more ${photoWord(photosNeeded)}`}
              onPress={onAddPhotos}
            />
            <Button label="Choose another frame" variant="ghost" onPress={onClose} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(28, 25, 20, 0.45)',
  },
  sheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  copy: {
    flex: 1,
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  title: {
    fontSize: typography.sizeLg,
    lineHeight: typography.sizeLg * 1.25,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
    letterSpacing: -0.2,
  },
  body: {
    fontSize: typography.sizeSm,
    lineHeight: typography.sizeSm * 1.5,
    color: colors.inkSoft,
  },
  actions: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
});
