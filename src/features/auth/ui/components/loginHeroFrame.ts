/** Pixel size of assets/auth/login-hero.jpg. */
export const HERO_SIZE = { width: 1400, height: 934 } as const;

export type HeroFraming = 'couple' | 'sky';

type Spec = {
  /** Point of interest in the photo, as a 0–1 fraction of its width/height. */
  focal: { x: number; y: number };
  /** Where that point should land on screen, as a 0–1 fraction of the screen. */
  anchor: { x: number; y: number };
  /** Extra enlargement on top of "cover". */
  zoom: number;
};

const SPECS: Record<HeroFraming, Spec> = {
  // The couple walking on the shore, in the upper third above the brand block.
  couple: { focal: { x: 0.333, y: 0.47 }, anchor: { x: 0.5, y: 0.21 }, zoom: 1.12 },
  // Open sky and clouds only, so form copy never sits on the white dress.
  sky: { focal: { x: 0.8, y: 0.2 }, anchor: { x: 0.5, y: 0.3 }, zoom: 1.2 },
};

export type HeroFrame = { left: number; top: number; width: number; height: number };

/**
 * Where to draw the photo so it always covers the screen horizontally and
 * its top edge, with the focal point as close to the anchor as the photo's
 * edges allow. The bottom may stop short: the scrim fades to solid there.
 */
export function heroFrame(
  screenWidth: number,
  screenHeight: number,
  framing: HeroFraming,
): HeroFrame {
  const spec = SPECS[framing];
  const cover = Math.max(screenWidth / HERO_SIZE.width, screenHeight / HERO_SIZE.height);
  const scale = cover * spec.zoom;
  const width = HERO_SIZE.width * scale;
  const height = HERO_SIZE.height * scale;

  const wantedLeft = screenWidth * spec.anchor.x - spec.focal.x * width;
  const wantedTop = screenHeight * spec.anchor.y - spec.focal.y * height;

  return {
    left: Math.min(0, Math.max(screenWidth - width, wantedLeft)),
    top: Math.min(0, wantedTop),
    width,
    height,
  };
}
