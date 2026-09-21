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
  return value;
}

/**
 * Ranked frames for this person + moment. Only one template per layout is
 * returned — two entries sharing a layout render an identical card once the
 * occasion headline is applied, so offering both is a choice without a
 * difference.
 */
export function recommendTemplates(input: RecommendInput): TemplateDefinition[] {
  const limit = input.limit ?? 8;
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
