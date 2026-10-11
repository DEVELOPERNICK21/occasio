export type WishLayoutId =
  | "editorial_portrait"
  | "dual_editorial"
  | "minimal_fullscreen"
  | "film_strip"
  | "asymmetric_split"
  | "story_mosaic"
  | "polaroid_overlay"
  | "scrapbook"
  | "poster_type"
  | "big_words"
  | "framed_blur"
  | "cinema_still"
  | "handwritten_note"
  | "postcard"
  | "photo_booth"
  | "contact_sheet";

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
  G05: "scrapbook",
  G06: "poster_type",
  G07: "big_words",
  G08: "framed_blur",
  F01: "cinema_still",
  F02: "handwritten_note",
  F03: "postcard",
  F04: "photo_booth",
  F05: "contact_sheet",
};

const MIN_PHOTOS: Record<WishLayoutId, number> = {
  editorial_portrait: 1,
  dual_editorial: 2,
  minimal_fullscreen: 1,
  film_strip: 3,
  asymmetric_split: 4,
  story_mosaic: 5,
  polaroid_overlay: 2,
  scrapbook: 3,
  poster_type: 1,
  big_words: 4,
  framed_blur: 1,
  cinema_still: 1,
  handwritten_note: 1,
  postcard: 1,
  photo_booth: 3,
  contact_sheet: 5,
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
