export type WishLayoutId =
  | "editorial_portrait"
  | "dual_editorial"
  | "minimal_fullscreen"
  | "film_strip"
  | "asymmetric_split"
  | "story_mosaic"
  | "polaroid_overlay";

/**
 * Mirrors the seed catalog in the app
 * (`src/features/create/data/templates/catalog.json`). Keep both in sync until
 * the catalog is served remotely.
 */
const LAYOUT_BY_TEMPLATE_ID: Record<string, WishLayoutId> = {
  B01: "editorial_portrait",
  B04: "dual_editorial",
  B10: "minimal_fullscreen",
  L06: "editorial_portrait",
  T01: "editorial_portrait",
  G01: "film_strip",
  G02: "asymmetric_split",
  G03: "story_mosaic",
  G04: "polaroid_overlay",
};

const MIN_PHOTOS: Record<WishLayoutId, number> = {
  editorial_portrait: 1,
  dual_editorial: 2,
  minimal_fullscreen: 1,
  film_strip: 3,
  asymmetric_split: 4,
  story_mosaic: 5,
  polaroid_overlay: 2,
};

/** Cards created before frames shipped fall back to the original layout. */
export function wishLayoutId(
  templateId: string | null | undefined,
  photoCount: number,
): WishLayoutId {
  const layout = templateId ? LAYOUT_BY_TEMPLATE_ID[templateId] : undefined;
  if (!layout) return "editorial_portrait";
  if (photoCount < MIN_PHOTOS[layout]) {
    return "editorial_portrait";
  }
  return layout;
}
