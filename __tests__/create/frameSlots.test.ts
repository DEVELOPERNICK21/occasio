import { assignPhotoToSlot, slotLabels } from '../../src/features/create/domain/frameSlots';

describe('slotLabels', () => {
  it('names the snapshot frame spots', () => {
    expect(slotLabels('polaroid_overlay', 2)).toEqual(['Background', 'Snapshot']);
  });

  it('only returns as many labels as there are slots', () => {
    expect(slotLabels('story_mosaic', 3)).toEqual(['Banner', 'Grid 1', 'Grid 2']);
  });

  it('falls back to numbered labels past the known ones', () => {
    expect(slotLabels('editorial_portrait', 2)).toEqual(['Main photo', 'Photo 2']);
  });
});

describe('assignPhotoToSlot', () => {
  const photos = ['a', 'b', 'c', 'd'];

  it('moves the chosen photo into the slot and swaps the old one out', () => {
    expect(assignPhotoToSlot(photos, 0, 2)).toEqual(['c', 'b', 'a', 'd']);
  });

  it('keeps every photo — nothing is dropped', () => {
    const next = assignPhotoToSlot(photos, 1, 3);
    expect([...next].sort()).toEqual([...photos].sort());
  });

  it('returns the same array when nothing changes or indexes are out of range', () => {
    expect(assignPhotoToSlot(photos, 1, 1)).toBe(photos);
    expect(assignPhotoToSlot(photos, 0, 9)).toBe(photos);
    expect(assignPhotoToSlot(photos, -1, 0)).toBe(photos);
  });
});
