// __tests__/create/templateSystem.test.ts
import { loadCatalog } from '../../src/features/create/data/templateCatalog';
import {
  defaultTemplateIdForType,
  homeSelectionFromTemplateType,
  occasionFromTemplateType,
} from '../../src/features/create/domain/audienceOccasion';
import { parseTemplateCatalog } from '../../src/features/create/domain/templateSchema';
import {
  listFrames,
  lockedTemplates,
  nextUnlock,
  recommendTemplates,
} from '../../src/features/create/domain/recommendTemplates';
import catalogJson from '../../src/features/create/data/templates/catalog.json';

const catalog = parseTemplateCatalog(catalogJson);

describe('defaultTemplateIdForType', () => {
  it('maps birthday family to B10', () => {
    expect(defaultTemplateIdForType('birthday')).toBe('B10');
    expect(defaultTemplateIdForType('mothers_day')).toBe('B10');
    expect(defaultTemplateIdForType('fathers_day')).toBe('B10');
  });

  it('maps thank_you and congratulations to T01', () => {
    expect(defaultTemplateIdForType('thank_you')).toBe('T01');
    expect(defaultTemplateIdForType('congratulations')).toBe('T01');
  });

  it('maps just_because to L06', () => {
    expect(defaultTemplateIdForType('just_because')).toBe('L06');
  });

  it('maps anniversary, sorry, and proposal to B01', () => {
    expect(defaultTemplateIdForType('anniversary')).toBe('B01');
    expect(defaultTemplateIdForType('sorry')).toBe('B01');
    expect(defaultTemplateIdForType('proposal')).toBe('B01');
  });
});

describe('occasionFromTemplateType', () => {
  it('returns occasion for catalog occasions', () => {
    expect(occasionFromTemplateType('birthday')).toBe('birthday');
    expect(occasionFromTemplateType('anniversary')).toBe('anniversary');
    expect(occasionFromTemplateType('thank_you')).toBe('thank_you');
    expect(occasionFromTemplateType('congratulations')).toBe('congratulations');
    expect(occasionFromTemplateType('just_because')).toBe('just_because');
  });

  it('returns null for non-occasion template types', () => {
    expect(occasionFromTemplateType('mothers_day')).toBeNull();
    expect(occasionFromTemplateType('fathers_day')).toBeNull();
    expect(occasionFromTemplateType('sorry')).toBeNull();
    expect(occasionFromTemplateType('proposal')).toBeNull();
  });
});

describe('homeSelectionFromTemplateType', () => {
  it('maps mothers/fathers day to birthday with audience', () => {
    expect(homeSelectionFromTemplateType('mothers_day')).toEqual({
      occasion: 'birthday',
      audience: 'mom',
    });
    expect(homeSelectionFromTemplateType('fathers_day')).toEqual({
      occasion: 'birthday',
      audience: 'dad',
    });
  });

  it('keeps birthday without audience so WhoFor can ask', () => {
    expect(homeSelectionFromTemplateType('birthday')).toEqual({
      occasion: 'birthday',
      audience: null,
    });
  });
});

describe('loadCatalog', () => {
  it('returns 18 templates', () => {
    expect(loadCatalog()).toHaveLength(18);
  });
});

describe('parseTemplateCatalog', () => {
  it('parses the seed catalog (18 templates)', () => {
    const parsed = parseTemplateCatalog(catalogJson);
    expect(parsed).toHaveLength(18);
    expect(parsed.map((t) => t.id).sort()).toEqual(
      [
        'B01', 'B04', 'B10', 'F01', 'F02', 'F03', 'F04', 'F05',
        'G01', 'G02', 'G03', 'G04', 'G05', 'G06', 'G07', 'G08',
        'L06', 'T01',
      ].sort(),
    );
  });

  it('accepts collage layout ids and photoSlots 1–5', () => {
    const collage = parseTemplateCatalog(catalogJson).filter((t) =>
      t.id.startsWith('G'),
    );
    expect(collage.map((t) => t.layoutId).sort()).toEqual(
      [
        'asymmetric_split',
        'big_words',
        'film_strip',
        'framed_blur',
        'polaroid_overlay',
        'poster_type',
        'scrapbook',
        'story_mosaic',
      ].sort(),
    );
    expect(collage.map((t) => t.photoSlots).sort()).toEqual([1, 1, 2, 3, 3, 4, 4, 5]);
  });

  it('rejects invalid catalog entries', () => {
    expect(() =>
      parseTemplateCatalog([{ id: 'X', layoutId: 'nope' }]),
    ).toThrow();
  });
});

describe('recommendTemplates', () => {
  it('ranks B04 first for mom + birthday when 2 photos allowed', () => {
    const ids = recommendTemplates({
      audience: 'mom',
      occasion: 'birthday',
      catalog,
      maxPhotosAllowed: 2,
    }).map((t) => t.id);
    expect(ids[0]).toBe('B04');
    expect(ids.length).toBeGreaterThanOrEqual(1);
    expect(ids.length).toBeLessThanOrEqual(12);
  });

  it('hides B04 when only 1 photo allowed', () => {
    const ids = recommendTemplates({
      audience: 'mom',
      occasion: 'birthday',
      catalog,
      maxPhotosAllowed: 1,
    }).map((t) => t.id);
    expect(ids).not.toContain('B04');
    expect(ids).not.toContain('G01');
    expect(ids).not.toContain('G04');
    expect(ids.length).toBeGreaterThan(0);
  });

  it('surfaces collage frames when 5 photos are allowed', () => {
    const ids = recommendTemplates({
      audience: 'friend',
      occasion: 'birthday',
      catalog,
      maxPhotosAllowed: 5,
    }).map((t) => t.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        'G01', 'G02', 'G03', 'G04', 'G05', 'G06', 'G07', 'G08',
      ]),
    );
  });

  it('offers the single-photo Poster and Framed frames with 1 photo', () => {
    const ids = recommendTemplates({
      audience: 'friend',
      occasion: 'birthday',
      catalog,
      maxPhotosAllowed: 1,
    }).map((t) => t.id);
    expect(ids).toEqual(expect.arrayContaining(['G06', 'G08']));
    expect(ids).not.toContain('G05');
    expect(ids).not.toContain('G07');
  });

  it('hides multi-photo collages when only 2 photos are allowed', () => {
    const ids = recommendTemplates({
      audience: 'friend',
      occasion: 'birthday',
      catalog,
      maxPhotosAllowed: 2,
    }).map((t) => t.id);
    expect(ids).toContain('G04');
    expect(ids).not.toContain('G01');
    expect(ids).not.toContain('G02');
    expect(ids).not.toContain('G03');
  });

  it('prefers L06 for partner + just_because', () => {
    const ids = recommendTemplates({
      audience: 'partner',
      occasion: 'just_because',
      catalog,
      maxPhotosAllowed: 1,
    }).map((t) => t.id);
    expect(ids[0]).toBe('L06');
  });

  it('never offers two frames with the same layout', () => {
    const occasions = [
      'birthday',
      'anniversary',
      'thank_you',
      'congratulations',
      'just_because',
    ] as const;
    const audiences = [
      'mom',
      'dad',
      'partner',
      'friend',
      'family',
      'someone_special',
    ] as const;

    for (const occasion of occasions) {
      for (const audience of audiences) {
        const layouts = recommendTemplates({
          audience,
          occasion,
          catalog,
          maxPhotosAllowed: 5,
        }).map((t) => t.layoutId);
        expect(new Set(layouts).size).toBe(layouts.length);
      }
    }
  });

  it('does not offer the thank you frame inside a birthday flow', () => {
    const ids = recommendTemplates({
      audience: 'mom',
      occasion: 'birthday',
      catalog,
      maxPhotosAllowed: 2,
    }).map((t) => t.id);
    expect(ids).not.toContain('T01');
  });

  it('never returns empty for thin occasion matches', () => {
    const ids = recommendTemplates({
      audience: 'friend',
      occasion: 'congratulations',
      catalog,
      maxPhotosAllowed: 1,
    });
    expect(ids.length).toBeGreaterThan(0);
  });
});

describe('expressive frames (F01–F05)', () => {
  const byId = new Map(catalog.map((t) => [t.id, t]));

  it('adds five new layouts with their photo needs', () => {
    expect(
      ['F01', 'F02', 'F03', 'F04', 'F05'].map((id) => [
        byId.get(id)?.layoutId,
        byId.get(id)?.photoSlots,
      ]),
    ).toEqual([
      ['cinema_still', 1],
      ['handwritten_note', 1],
      ['postcard', 1],
      ['photo_booth', 3],
      ['contact_sheet', 5],
    ]);
  });

  it('gives every layout exactly one template, so the picker never shows twins', () => {
    const layouts = catalog.map((t) => t.layoutId);
    const withMultiple = layouts.filter((id, i) => layouts.indexOf(id) !== i);
    // editorial_portrait is shared on purpose by B01 / L06 / T01 (tuned per occasion).
    expect(new Set(withMultiple)).toEqual(new Set(['editorial_portrait']));
  });

  it('offers one-photo people more than the original four frames', () => {
    const oneSlot = recommendTemplates({
      audience: 'friend',
      occasion: 'birthday',
      catalog,
      maxPhotosAllowed: 1,
    });
    expect(oneSlot.map((t) => t.layoutId)).toEqual(
      expect.arrayContaining(['cinema_still', 'handwritten_note', 'postcard']),
    );
    expect(oneSlot.length).toBeGreaterThanOrEqual(7);
  });

  it('favours a handwritten note for a thank-you to mom, and a photo booth for a friend', () => {
    const forMom = recommendTemplates({
      audience: 'mom',
      occasion: 'thank_you',
      catalog,
      maxPhotosAllowed: 5,
    });
    const forFriend = recommendTemplates({
      audience: 'friend',
      occasion: 'birthday',
      catalog,
      maxPhotosAllowed: 5,
    });
    expect(forMom.slice(0, 3).map((t) => t.layoutId)).toContain('handwritten_note');
    expect(forFriend.slice(0, 3).map((t) => t.layoutId)).toContain('photo_booth');
  });
});

describe('lockedTemplates and nextUnlock', () => {
  const input = { occasion: 'birthday' as const, catalog, maxPhotos: 5 };

  it('lists frames that need more photos, fewest extra first', () => {
    const locked = lockedTemplates({ ...input, photoCount: 1 });
    const needed = locked.map((l) => l.photosNeeded);
    expect(needed).toEqual([...needed].sort((a, b) => a - b));
    expect(locked.every((l) => l.template.photoSlots > 1)).toBe(true);
    expect(locked[0].photosNeeded).toBe(1);
  });

  it('names the closest unlock', () => {
    const next = nextUnlock({ ...input, photoCount: 2 });
    expect(next?.photosNeeded).toBe(1);
    expect(next?.template.photoSlots).toBe(3);
  });

  it('has nothing to unlock once every frame is available', () => {
    expect(lockedTemplates({ ...input, photoCount: 5 })).toEqual([]);
    expect(nextUnlock({ ...input, photoCount: 5 })).toBeNull();
  });

  it('never lists frames the app cannot fill', () => {
    const locked = lockedTemplates({ ...input, photoCount: 1, maxPhotos: 3 });
    expect(locked.every((l) => l.template.photoSlots <= 3)).toBe(true);
  });
});

describe('listFrames: every frame stays visible and selectable', () => {
  const base = {
    audience: 'friend' as const,
    occasion: 'birthday' as const,
    catalog,
    maxPhotos: 5,
  };

  it('lists every layout for the moment, whatever the photo count', () => {
    const everything = listFrames({ ...base, photoCount: 5 });
    const withOne = listFrames({ ...base, photoCount: 1 });

    expect(withOne.map((c) => c.template.id).sort()).toEqual(
      everything.map((c) => c.template.id).sort(),
    );
    expect(withOne.length).toBeGreaterThanOrEqual(15);
  });

  it('puts frames that fit the photos first, then the ones that need more', () => {
    const list = listFrames({ ...base, photoCount: 2 });
    const firstShort = list.findIndex((c) => c.photosNeeded > 0);

    expect(firstShort).toBeGreaterThan(0);
    expect(list.slice(0, firstShort).every((c) => c.template.photoSlots <= 2)).toBe(true);
    expect(list.slice(firstShort).every((c) => c.photosNeeded > 0)).toBe(true);
  });

  it('says how many more photos each short frame needs', () => {
    for (const choice of listFrames({ ...base, photoCount: 1 })) {
      expect(choice.photosNeeded).toBe(Math.max(0, choice.template.photoSlots - 1));
    }
  });

  it('does not call anything short before any photo is added', () => {
    expect(listFrames({ ...base, photoCount: 0 }).every((c) => c.photosNeeded === 0)).toBe(true);
  });

  it('keeps every older frame in the list, not just the new ones', () => {
    const ids = listFrames({ ...base, photoCount: 1 }).map((c) => c.template.id);
    for (const id of ['B01', 'B04', 'B10', 'G01', 'G02', 'G03', 'G04', 'G05', 'G06', 'G07', 'G08']) {
      expect(ids).toContain(id);
    }
  });
});
