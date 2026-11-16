/*
 * The data file is named differently on purpose: Metro tries ".json" before ".ts" when an import has no
 * extension, so a "festivalArt.json" beside this file would be loaded instead of this module.
 */
import artData from './festivalArtData.json';

/**
 * What each festival is drawn with: the drawing that is its face, the ones that belong to it, what the
 * recipient taps in the story, what hangs across the top, what drifts behind, what Pip wears and the
 * finale. Written in `scripts/art/festival-motifs.mjs` (which also draws the pictures) and copied to the
 * recipient's page, so a festival looks the same in the app and on the link.
 */
export type FestivalArt = {
  /** The festival's face: its tile in the list and on Home, and its corner decoration. */
  hero: string;
  /** More drawings that belong to it. */
  extras: readonly string[];
  /** Four things tapped in the story: a diya lights, a cracker bursts, a tree's stars come on. */
  taps: readonly string[];
  garland: string | null;
  ambient: ReadonlyArray<{ motif: string; motion: 'rise' | 'fall' | 'float' | 'twinkle' }>;
  costume: string;
  fx: string;
};

const ART = artData.festivals as unknown as Record<string, FestivalArt>;

/** The look of a festival card type, or null for any other card type. */
export function festivalArtFor(templateType: string | null | undefined): FestivalArt | null {
  return templateType && Object.prototype.hasOwnProperty.call(ART, templateType) ? ART[templateType]! : null;
}

/** The drawings for corner decoration, the face first. */
export function ornamentMotifs(templateType: string | null | undefined, max = 3): string[] {
  const art = festivalArtFor(templateType);
  return art ? [art.hero, ...art.extras].slice(0, max) : [];
}

export const FESTIVAL_ART_IDS: readonly string[] = Object.keys(ART);
