import type { LayoutId } from './templateSchema';

/** What each photo position is called in a frame, in `photoUris` order. */
const SLOT_LABELS: Record<LayoutId, readonly string[]> = {
  editorial_portrait: ['Main photo'],
  minimal_fullscreen: ['Main photo'],
  poster_type: ['Main photo'],
  framed_blur: ['Main photo'],
  dual_editorial: ['Large', 'Side'],
  polaroid_overlay: ['Background', 'Snapshot'],
  film_strip: ['Top', 'Middle', 'Bottom'],
  scrapbook: ['Left', 'Right', 'Bottom'],
  asymmetric_split: ['Top left', 'Middle left', 'Tall', 'Footer'],
  big_words: ['Top left', 'Top right', 'Bottom left', 'Bottom right'],
  story_mosaic: ['Banner', 'Grid 1', 'Grid 2', 'Grid 3', 'Grid 4'],
};

export function slotLabels(layoutId: LayoutId, slotCount: number): string[] {
  const labels = SLOT_LABELS[layoutId];
  return Array.from(
    { length: slotCount },
    (_, i) => labels[i] ?? `Photo ${i + 1}`,
  );
}

/**
 * Put the photo at `photoIndex` into slot `slotIndex`. Frames read photos by
 * position, so this swaps the two entries; the displaced photo takes the
 * chosen photo's old place rather than being dropped.
 */
export function assignPhotoToSlot(
  photoUris: string[],
  slotIndex: number,
  photoIndex: number,
): string[] {
  if (
    slotIndex === photoIndex ||
    slotIndex < 0 ||
    photoIndex < 0 ||
    slotIndex >= photoUris.length ||
    photoIndex >= photoUris.length
  ) {
    return photoUris;
  }
  const next = [...photoUris];
  [next[slotIndex], next[photoIndex]] = [next[photoIndex], next[slotIndex]];
  return next;
}
