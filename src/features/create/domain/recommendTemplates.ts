import type { Audience, Occasion, TemplateDefinition } from './templateSchema';

export type RecommendInput = {
  audience: Audience;
  occasion: Occasion;
  catalog: TemplateDefinition[];
  maxPhotosAllowed: number;
  limit?: number;
};

const FALLBACK_ORDER = ['B10', 'B01', 'T01', 'L06', 'B04'] as const;

const ROMANTIC_AUDIENCES: Audience[] = ['partner', 'someone_special'];
const PARENT_AUDIENCES: Audience[] = ['mom', 'dad', 'family'];
const PEER_AUDIENCES: Audience[] = ['friend', 'partner', 'someone_special'];

/**
 * Extra weight for the newer, more expressive frames, so they surface for the
 * people and moments they suit instead of sorting by catalog order.
 */
function expressiveBonus(input: RecommendInput, layoutId: TemplateDefinition['layoutId']): number {
  const { audience, occasion } = input;
  switch (layoutId) {
    case 'handwritten_note':
      if (PARENT_AUDIENCES.includes(audience) || ROMANTIC_AUDIENCES.includes(audience)) {
        return occasion === 'thank_you' || occasion === 'anniversary' || occasion === 'just_because'
          ? 12
          : 6;
      }
      return 2;
    case 'postcard':
      return occasion === 'just_because' || occasion === 'thank_you' ? 10 : 3;
    case 'cinema_still':
      return PEER_AUDIENCES.includes(audience) &&
        (occasion === 'birthday' || occasion === 'anniversary' || occasion === 'congratulations')
        ? 10
        : 3;
    case 'photo_booth':
      return audience === 'friend' ? 12 : PEER_AUDIENCES.includes(audience) ? 7 : 2;
    case 'contact_sheet':
      return occasion === 'anniversary' || occasion === 'birthday' ? 8 : 4;
    default:
      return 0;
  }
}

function score(input: RecommendInput, template: TemplateDefinition): number {
  let value = 10;
  if (template.audiences.includes(input.audience)) value += 8;
  if (
    input.audience === 'mom' &&
    input.occasion === 'birthday' &&
    template.id === 'B04'
  ) {
    value += 20;
  }
  if (
    ROMANTIC_AUDIENCES.includes(input.audience) &&
    (input.occasion === 'just_because' || input.occasion === 'anniversary') &&
    template.id === 'L06'
  ) {
    value += 20;
  }
  if (input.occasion === 'thank_you' && template.id === 'T01') value += 15;
  if (
    input.occasion === 'birthday' &&
    (template.id === 'B01' || template.id === 'B10')
  ) {
    value += 5;
  }
  value += expressiveBonus(input, template.layoutId);
  return value;
}

/**
 * Ranked frames for this person + moment. Only one template per layout is
 * returned — two entries sharing a layout render an identical card once the
 * occasion headline is applied, so offering both is a choice without a
 * difference.
 */
export function recommendTemplates(input: RecommendInput): TemplateDefinition[] {
  const limit = input.limit ?? 16;
  const eligible = input.catalog.filter(
    (t) => t.photoSlots <= input.maxPhotosAllowed,
  );

  const matching = eligible.filter((t) => t.occasions.includes(input.occasion));

  const scored = matching
    .map((t) => ({ t, value: score(input, t) }))
    .sort((a, b) => b.value - a.value || a.t.id.localeCompare(b.t.id));

  let ranked = scored.map((s) => s.t);

  if (ranked.length === 0) {
    const byId = new Map(eligible.map((t) => [t.id, t]));
    ranked = FALLBACK_ORDER.map((id) => byId.get(id)).filter(
      (t): t is TemplateDefinition => Boolean(t),
    );
  }

  const usedLayouts = new Set<TemplateDefinition['layoutId']>();
  const out: TemplateDefinition[] = [];
  for (const t of ranked) {
    if (usedLayouts.has(t.layoutId)) continue;
    usedLayouts.add(t.layoutId);
    out.push(t);
    if (out.length >= limit) break;
  }

  if (out.length === 0 && eligible.length > 0) {
    return eligible.slice(0, limit);
  }

  return out;
}

export type LockedTemplate = {
  template: TemplateDefinition;
  /** How many more photos it needs than the user has added. */
  photosNeeded: number;
};

/**
 * Frames that suit this moment but need more photos than the user has added so
 * far — shown as "unlock with more photos" so richer frames are discoverable
 * instead of silently missing. One per layout, fewest extra photos first.
 */
export function lockedTemplates(input: {
  occasion: Occasion;
  catalog: TemplateDefinition[];
  photoCount: number;
  maxPhotos: number;
}): LockedTemplate[] {
  const seen = new Set<TemplateDefinition['layoutId']>();
  return input.catalog
    .filter(
      (t) =>
        t.occasions.includes(input.occasion) &&
        t.photoSlots > input.photoCount &&
        t.photoSlots <= input.maxPhotos,
    )
    .sort((a, b) => a.photoSlots - b.photoSlots || a.id.localeCompare(b.id))
    .filter((t) => {
      if (seen.has(t.layoutId)) return false;
      seen.add(t.layoutId);
      return true;
    })
    .map((template) => ({
      template,
      photosNeeded: template.photoSlots - input.photoCount,
    }));
}

/** The closest frame the user could unlock by adding photos, or null. */
export function nextUnlock(input: {
  occasion: Occasion;
  catalog: TemplateDefinition[];
  photoCount: number;
  maxPhotos: number;
}): LockedTemplate | null {
  return lockedTemplates(input)[0] ?? null;
}

export type FrameChoice = {
  template: TemplateDefinition;
  /** How many more photos this frame needs than have been added. 0 = it fits now. */
  photosNeeded: number;
};

/**
 * Every frame for this moment and person, best match first. Frames that already
 * fit the photos added come first; the rest follow, each saying how many more
 * photos it needs. Nothing is hidden: a frame that needs more photos can still
 * be chosen, and the missing photos added from there.
 */
export function listFrames(
  input: Omit<RecommendInput, 'maxPhotosAllowed'> & {
    photoCount: number;
    maxPhotos: number;
  },
): FrameChoice[] {
  const ranked = recommendTemplates({ ...input, maxPhotosAllowed: input.maxPhotos });
  const choices = ranked.map((template) => ({
    template,
    // Before any photo is added nothing is "missing" yet.
    photosNeeded:
      input.photoCount < 1 ? 0 : Math.max(0, template.photoSlots - input.photoCount),
  }));
  return [
    ...choices.filter((choice) => choice.photosNeeded === 0),
    ...choices.filter((choice) => choice.photosNeeded > 0),
  ];
}
