import { useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing, typography } from '../../../../shared/theme/tokens';
import { Button } from '../../../../shared/ui/Button';
import { ModalCloseButton } from '../../../../shared/ui/ModalCloseButton';
import { Text } from '../../../../shared/ui/Text';
import { assignPhotoToSlot, slotLabels } from '../../domain/frameSlots';
import type { TemplateDefinition } from '../../domain/templateSchema';
import { DesignFramePreview, type FrameTone } from './DesignFramePreview';

type Props = {
  template: TemplateDefinition | null;
  photoUris: string[];
  headline: string;
  tone: FrameTone;
  onClose: () => void;
  onConfirm: (photoUris: string[]) => void;
};

/** Pick which photo fills each spot in the chosen frame. */
export function ArrangePhotosSheet({
  template,
  photoUris,
  headline,
  tone,
  onClose,
  onConfirm,
}: Props) {
  const insets = useSafeAreaInsets();
  const [order, setOrder] = useState(photoUris);
  const [selectedSlot, setSelectedSlot] = useState(0);

  if (!template) return null;

  const slotCount = Math.min(template.photoSlots, order.length);
  const labels = slotLabels(template.layoutId, slotCount);

  const pickPhoto = (photoIndex: number) => {
    setOrder((prev) => assignPhotoToSlot(prev, selectedSlot, photoIndex));
    if (selectedSlot < slotCount - 1) setSelectedSlot(selectedSlot + 1);
  };

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
            <View style={styles.headerCopy}>
              <Text style={styles.title}>Arrange photos</Text>
              <Text style={styles.subtitle}>
                {slotCount > 1
                  ? 'Tap a spot, then pick the photo for it.'
                  : 'Pick the photo for this frame.'}
              </Text>
            </View>
            <ModalCloseButton onPress={onClose} />
          </View>

          <View style={styles.preview}>
            <DesignFramePreview
              layoutId={template.layoutId}
              title={headline}
              tone={tone}
              photoUris={order}
              height={230}
            />
          </View>

          {slotCount > 1 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
              {labels.map((label, i) => {
                const selected = i === selectedSlot;
                return (
                  <Pressable
                    key={label}
                    onPress={() => setSelectedSlot(i)}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    accessibilityLabel={`${label} spot`}
                    style={[styles.chip, selected && styles.chipSelected]}
                  >
                    <Image source={{ uri: order[i] }} style={styles.chipThumb} />
                    <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : null}

          <Text style={styles.sectionLabel}>
            {slotCount > 1 ? `Photo for “${labels[selectedSlot]}”` : 'Your photos'}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.photoRow}
          >
            {order.map((uri, i) => {
              const inSelected = i === selectedSlot;
              const inFrame = i < slotCount;
              return (
                <Pressable
                  key={i}
                  onPress={() => pickPhoto(i)}
                  accessibilityRole="button"
                  accessibilityLabel={`Photo ${i + 1}${inFrame ? `, in ${labels[i]}` : ''}`}
                  style={[styles.photo, inSelected && styles.photoSelected]}
                >
                  <Image source={{ uri }} style={styles.photoImage} />
                  {inFrame && slotCount > 1 ? (
                    <View style={styles.photoBadge}>
                      <Text style={styles.photoBadgeText}>{i + 1}</Text>
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </ScrollView>
          {order.length > slotCount ? (
            <Text style={styles.note}>Photos not in the frame still show in the story.</Text>
          ) : null}

          <Button label="Use this frame" onPress={() => onConfirm(order)} style={styles.cta} />
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
  headerCopy: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: typography.sizeLg,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
  },
  subtitle: {
    fontSize: typography.sizeSm,
    color: colors.inkSoft,
  },
  preview: {
    marginTop: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  chipRow: {
    gap: spacing.sm,
    paddingTop: spacing.md,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingLeft: 4,
    paddingRight: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.sidebar,
  },
  chipThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.border,
  },
  chipLabel: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightMedium,
    color: colors.inkSoft,
  },
  chipLabelSelected: {
    color: colors.accentHover,
    fontWeight: typography.weightSemibold,
  },
  sectionLabel: {
    marginTop: spacing.md,
    fontSize: typography.sizeXs,
    fontWeight: typography.weightSemibold,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  photoRow: {
    gap: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: 2,
  },
  photo: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  photoSelected: {
    borderColor: colors.accent,
  },
  photoImage: {
    width: '100%',
    height: '100%',
    borderRadius: radius.sm,
  },
  photoBadge: {
    position: 'absolute',
    top: 3,
    left: 3,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
  },
  photoBadgeText: {
    fontSize: 11,
    fontWeight: typography.weightSemibold,
    color: colors.white,
  },
  note: {
    marginTop: spacing.xs,
    fontSize: typography.sizeXs,
    color: colors.muted,
  },
  cta: {
    marginTop: spacing.lg,
  },
});
