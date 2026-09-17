export type WishLayoutId =
  | "editorial_portrait"
  | "dual_editorial"
  | "minimal_fullscreen";

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
};

/** Cards created before frames shipped fall back to the original layout. */
export function wishLayoutId(
  templateId: string | null | undefined,
  photoCount: number,
): WishLayoutId {
  const layout = templateId ? LAYOUT_BY_TEMPLATE_ID[templateId] : undefined;
  if (!layout) return "editorial_portrait";
  if (layout === "dual_editorial" && photoCount < 2) {
    return "editorial_portrait";
  }
  return layout;
}
