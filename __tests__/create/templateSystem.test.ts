// __tests__/create/templateSystem.test.ts
import { loadCatalog } from '../../src/features/create/data/templateCatalog';
import {
  defaultTemplateIdForType,
  homeSelectionFromTemplateType,
  occasionFromTemplateType,
} from '../../src/features/create/domain/audienceOccasion';
import { parseTemplateCatalog } from '../../src/features/create/domain/templateSchema';
import { recommendTemplates } from '../../src/features/create/domain/recommendTemplates';
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
  it('returns 9 templates', () => {
    expect(loadCatalog()).toHaveLength(9);
  });
});

describe('parseTemplateCatalog', () => {
  it('parses the seed catalog (9 templates)', () => {
    const parsed = parseTemplateCatalog(catalogJson);
    expect(parsed).toHaveLength(9);
    expect(parsed.map((t) => t.id).sort()).toEqual(
      ['B01', 'B04', 'B10', 'G01', 'G02', 'G03', 'G04', 'L06', 'T01'].sort(),
    );
  });

  it('accepts collage layout ids and photoSlots 3–5', () => {
    const collage = parseTemplateCatalog(catalogJson).filter((t) =>
      t.id.startsWith('G'),
    );
    expect(collage.map((t) => t.layoutId).sort()).toEqual(
      [
        'asymmetric_split',
        'film_strip',
        'polaroid_overlay',
        'story_mosaic',
      ].sort(),
    );
    expect(collage.map((t) => t.photoSlots).sort()).toEqual([2, 3, 4, 5]);
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
    expect(ids.length).toBeLessThanOrEqual(8);
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
      expect.arrayContaining(['G01', 'G02', 'G03', 'G04']),
    );
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
