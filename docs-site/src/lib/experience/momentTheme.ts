/**
 * One place that defines how each moment looks and feels: palette, backdrop,
 * celebration style, mascot costume and the gate's jokes. Scenes read CSS
 * variables set from `vars`, so a new moment is a new entry here, not new CSS.
 */
import { mix, withAlpha } from '../colorMix';
import festivalArtData from '../festivalArtData.json';
import { HOLIDAY_LOOKS, webHolidayFor } from '../holidays';

export type MomentId =
  | 'birthday'
  | 'anniversary'
  | 'thank_you'
  | 'congratulations'
  | 'just_because';

export type FxPreset = 'confetti' | 'petals' | 'fireworks' | 'lanterns' | 'stars' | 'snow' | 'powder';

export type BackdropId = 'party' | 'romance' | 'garden' | 'celebration' | 'doodle' | 'festival';

export type Costume =
  | 'party_hat'
  | 'rose'
  | 'flower_crown'
  | 'medal'
  | 'shades'
  | 'santa_hat'
  | 'witch_hat'
  | 'bunny_ears'
  | 'holi_colour'
  /** A festival drawing worn on the head ("head:diya") or held in hand ("held:flag"). */
  | `head:${string}`
  | `held:${string}`;

/** A festival's signature look: what it is drawn with. Written in `scripts/art/festival-motifs.mjs`. */
export type FestivalStyle = {
  hero: string;
  extras: string[];
  /** Four things the recipient taps in the story. */
  taps: string[];
  garland: string | null;
  ambient: Array<{ motif: string; motion: 'rise' | 'fall' | 'float' | 'twinkle' }>;
  costume: string;
  fx: FxPreset;
};

const FESTIVAL_STYLES = festivalArtData.festivals as unknown as Record<string, FestivalStyle>;

export function festivalStyleFor(templateType: string): FestivalStyle | null {
  return Object.prototype.hasOwnProperty.call(FESTIVAL_STYLES, templateType) ? FESTIVAL_STYLES[templateType]! : null;
}

export type GateCopy = {
  /** Shown with the sender's name, e.g. "Sam made something for you". */
  hopeful: string;
  hopefulSub: string;
  /** After the first "No": Pip is shocked. The question stays open and the button turns into "Not now". */
  refusedOnce: string;
  refusedOnceSub: string;
  /** After "Not now": the card is closed and Pip cries a little. A joke about Pip, never a push to open it. */
  declined: string;
  declinedSub: string;
  yes: string;
};

export type GiftPattern = 'dots' | 'hearts' | 'leaves' | 'stars' | 'doodles';

/** How the 3D gift box is wrapped for this moment. */
export type GiftStyle = {
  paper: string;
  motif: string;
  motif2: string;
  ribbon: string;
  ribbonSheen: string;
  pattern: GiftPattern;
  glow: string;
};

/** How the 3D envelope and letter look for this moment. */
export type LetterStyle = {
  envelope: string;
  lining: string;
  liningMotif: string;
  wax: string;
  paper: string;
  ink: string;
  accent: string;
  /** Print on the envelope lining. */
  pattern: 'dots' | 'hearts' | 'leaves' | 'stars' | 'doodles';
};

/** How the 3D cake is decorated for the moments that have a candle scene. */
export type CakeStyle = {
  side: string;
  icing: string;
  sponge: string;
  filling: string;
  accent: string;
  sprinkles: string[];
  topper: 'cherry' | 'heart';
};

export type MomentTheme = {
  id: MomentId;
  /** The card type the song is chosen by, when it is not the moment (a festival keeps its own). */
  songType?: string;
  label: string;
  /** Set for a festival: its drawings, taps and costume. */
  festival?: FestivalStyle;
  dark: boolean;
  backdrop: BackdropId;
  fx: FxPreset;
  costume: Costume;
  /** Mascot body colours: light, base, shade. */
  mascot: { light: string; base: string; shade: string; cheek: string };
  /** Particle / confetti colours for this moment. */
  palette: string[];
  /** CSS custom properties applied to the story wrapper. */
  vars: Record<string, string>;
  /** Nouns for the star counter ("wishes", "hearts"...). */
  starName: string;
  gift: GiftStyle;
  cake: CakeStyle;
  letter: LetterStyle;
  gate: GateCopy;
};

const THEMES: Record<MomentId, MomentTheme> = {
  birthday: {
    id: 'birthday',
    label: 'Birthday',
    dark: false,
    backdrop: 'party',
    fx: 'confetti',
    costume: 'party_hat',
    mascot: { light: '#FFB27A', base: '#FF8A4C', shade: '#E2622B', cheek: '#FF5D7A' },
    palette: ['#FF4D6D', '#FFB703', '#3A86FF', '#8338EC', '#06D6A0', '#FB5607', '#FFD6E0'],
    starName: 'wishes',
    gift: { paper: '#FF5D7A', motif: '#FFFFFF', motif2: '#FFD166', ribbon: '#F2A900', ribbonSheen: '#FFE9A0', pattern: 'dots', glow: '#FFD166' },
    cake: { side: '#6B3A24', icing: '#FFF6EE', sponge: '#FBE3A3', filling: '#E0526F', accent: '#D62839', sprinkles: ['#FFD166', '#3A86FF', '#06D6A0', '#FF5D7A', '#FFFFFF'], topper: 'cherry' },
    letter: { envelope: '#FFB3C7', lining: '#FFF3D6', liningMotif: '#FFC233', wax: '#D62839', paper: '#FFFBF2', ink: '#3A2A3F', accent: '#F0476B', pattern: 'dots' },
    vars: {
      '--bg': '#FFF1E8',
      '--surface': '#FFFAF6',
      '--sidebar': '#FFE3EA',
      '--border': '#F6CBD5',
      '--ink': '#2B1B2E',
      '--ink-soft': '#4B3652',
      '--muted': '#87657F',
      '--accent': '#F0476B',
      '--accent-hover': '#D93659',
      '--accent-soft': '#FFC2D1',
      '--secondary': '#FFB020',
      '--on-accent': '#FFFFFF',
      '--story-mesh':
        'radial-gradient(70% 45% at 12% 4%, rgba(255,150,180,.55), transparent 70%), radial-gradient(60% 40% at 92% 10%, rgba(255,214,102,.55), transparent 70%), radial-gradient(80% 50% at 50% 100%, rgba(170,140,255,.40), transparent 70%), linear-gradient(180deg,#FFF1E8 0%,#FFE0EA 100%)',
    },
    gate: {
      hopeful: 'made something for you',
      hopefulSub: 'Pip has been guarding it all day.',
      refusedOnce: 'Excuse me?!',
      refusedOnceSub: 'Let’s pretend I didn’t hear that.',
      declined: 'Pip is crying now.',
      declinedSub: 'Tiny violin time. Pip will be fine.',
      yes: 'Show me!',
    },
  },
  anniversary: {
    id: 'anniversary',
    label: 'Anniversary',
    dark: false,
    backdrop: 'romance',
    fx: 'petals',
    costume: 'rose',
    mascot: { light: '#FFB3C7', base: '#FF86A8', shade: '#D9547D', cheek: '#FF4F7B' },
    palette: ['#E0446A', '#FF7A95', '#F5A623', '#FFB3C7', '#C4325A', '#FF9DB5'],
    starName: 'hearts',
    gift: { paper: '#8E1B3A', motif: '#C93A5E', motif2: '#F5D7A1', ribbon: '#F1D9A4', ribbonSheen: '#FFF4D6', pattern: 'hearts', glow: '#FF9DB5' },
    cake: { side: '#5B2333', icing: '#8A3350', sponge: '#F6D8C4', filling: '#C2415F', accent: '#F5C76B', sprinkles: ['#F5C76B', '#FF7A95', '#FFE3EA'], topper: 'heart' },
    letter: { envelope: '#F1E3CC', lining: '#8E1B3A', liningMotif: '#E8C77A', wax: '#7A0F2B', paper: '#FFF8EC', ink: '#4A1E2D', accent: '#C93A5E', pattern: 'hearts' },
    vars: {
      '--bg': '#FFF1F4',
      '--surface': '#FFFFFF',
      '--sidebar': '#FFDDE5',
      '--border': '#F5C2CE',
      '--ink': '#3A1626',
      '--ink-soft': '#5C2A3E',
      '--muted': '#94596C',
      '--accent': '#E0446A',
      '--accent-hover': '#C4325A',
      '--accent-soft': '#FFC2D0',
      '--secondary': '#F2A93B',
      '--on-accent': '#FFFFFF',
      '--story-mesh':
        'radial-gradient(70% 45% at 10% 4%, rgba(255,150,175,.5), transparent 70%), radial-gradient(60% 40% at 92% 12%, rgba(255,214,150,.45), transparent 70%), radial-gradient(80% 50% at 50% 100%, rgba(255,170,190,.35), transparent 70%), linear-gradient(180deg,#FFF1F4 0%,#FFE0E8 100%)',
    },
    gate: {
      hopeful: 'made something for you',
      hopefulSub: 'It took a while. It has feelings.',
      refusedOnce: 'Rude. But romantic.',
      refusedOnceSub: 'Pip will allow one more chance.',
      declined: 'Pip is sobbing into a rose.',
      declinedSub: 'Violins are involved.',
      yes: 'Open it',
    },
  },
  thank_you: {
    id: 'thank_you',
    label: 'Thank you',
    dark: false,
    backdrop: 'garden',
    fx: 'lanterns',
    costume: 'flower_crown',
    mascot: { light: '#C6E6A8', base: '#9BD07C', shade: '#5FA357', cheek: '#FF8FA3' },
    palette: ['#FFC857', '#FFE29A', '#F4A261', '#9BD07C', '#FFF3C4', '#E9C46A'],
    starName: 'thanks',
    gift: { paper: '#F3E3B8', motif: '#8DBE72', motif2: '#D9822B', ribbon: '#5FA357', ribbonSheen: '#C9E8B5', pattern: 'leaves', glow: '#FFE29A' },
    cake: { side: '#86B873', icing: '#FFFDF4', sponge: '#F8E7BB', filling: '#BFE0A8', accent: '#D9822B', sprinkles: ['#8DBE72', '#D9822B', '#FFFFFF'], topper: 'cherry' },
    letter: { envelope: '#D9B98A', lining: '#F3E3B8', liningMotif: '#7FAF69', wax: '#3E7D48', paper: '#FFFDF4', ink: '#3B3222', accent: '#D9822B', pattern: 'leaves' },
    vars: {
      '--bg': '#FFF7E6',
      '--surface': '#FFFCF4',
      '--sidebar': '#FBEBC8',
      '--border': '#EBD3A0',
      '--ink': '#2F2A1C',
      '--ink-soft': '#524A33',
      '--muted': '#8A7C55',
      '--accent': '#D9822B',
      '--accent-hover': '#BD6D1C',
      '--accent-soft': '#F5D29F',
      '--secondary': '#6FA76A',
      '--on-accent': '#FFFFFF',
      '--story-mesh':
        'radial-gradient(70% 45% at 90% 0%, rgba(255,214,120,.65), transparent 70%), radial-gradient(60% 40% at 8% 100%, rgba(150,205,140,.45), transparent 70%), linear-gradient(180deg,#FFF7E6 0%,#FBE6C4 100%)',
    },
    gate: {
      hopeful: 'has a thank-you for you',
      hopefulSub: 'Small words. Big feelings.',
      refusedOnce: 'You don’t want gratitude?!',
      refusedOnceSub: 'Pip is doing its best to stay calm.',
      declined: 'Pip is crying grateful tears anyway.',
      declinedSub: 'Somebody hand it a tissue.',
      yes: 'Okay, show me',
    },
  },
  congratulations: {
    id: 'congratulations',
    label: 'Congratulations',
    dark: false,
    backdrop: 'celebration',
    fx: 'fireworks',
    costume: 'medal',
    mascot: { light: '#FFE58A', base: '#FFCB3D', shade: '#E0A11A', cheek: '#FF8A5C' },
    palette: ['#F2A900', '#EF476F', '#3A86FF', '#06D6A0', '#8338EC', '#FF7A00'],
    starName: 'cheers',
    gift: { paper: '#1B2A6B', motif: '#FFD166', motif2: '#FFFFFF', ribbon: '#F2A900', ribbonSheen: '#FFE9A0', pattern: 'stars', glow: '#FFD166' },
    cake: { side: '#26397F', icing: '#FFD166', sponge: '#F6E7B8', filling: '#FFC233', accent: '#FFD166', sprinkles: ['#FFD166', '#FFFFFF', '#4CC9F0'], topper: 'heart' },
    letter: { envelope: '#22347F', lining: '#FFD166', liningMotif: '#FFFFFF', wax: '#F2A900', paper: '#FFFDF5', ink: '#1B2350', accent: '#F2A900', pattern: 'stars' },
    vars: {
      '--bg': '#FFF8E4',
      '--surface': '#FFFFFF',
      '--sidebar': '#FFEDBB',
      '--border': '#F1D88C',
      '--ink': '#1F2A5A',
      '--ink-soft': '#3A4680',
      '--muted': '#7A83B0',
      '--accent': '#3557E8',
      '--accent-hover': '#2542C8',
      '--accent-soft': '#C9D3FF',
      '--secondary': '#F2A900',
      '--on-accent': '#FFFFFF',
      '--story-mesh':
        'radial-gradient(70% 45% at 12% 4%, rgba(160,185,255,.5), transparent 70%), radial-gradient(60% 40% at 92% 10%, rgba(255,214,102,.55), transparent 70%), radial-gradient(80% 50% at 50% 100%, rgba(255,190,120,.35), transparent 70%), linear-gradient(180deg,#FFF8E4 0%,#FFEBB5 100%)',
    },
    gate: {
      hopeful: 'has news… and applause',
      hopefulSub: 'You did the thing. Want your moment?',
      refusedOnce: 'Humble. Way too humble.',
      refusedOnceSub: 'Pip is applauding anyway.',
      declined: 'Pip is crying proud tears.',
      declinedSub: 'The medal is getting wet.',
      yes: 'Take a bow',
    },
  },
  just_because: {
    id: 'just_because',
    label: 'Just because',
    dark: false,
    backdrop: 'doodle',
    fx: 'stars',
    costume: 'shades',
    mascot: { light: '#D5C6FF', base: '#B49BFF', shade: '#8466E8', cheek: '#FF8FB5' },
    palette: ['#7C5CFF', '#FF8FAB', '#5EEAD4', '#FFD166', '#A5B4FC', '#FDA4AF'],
    starName: 'sparks',
    gift: { paper: '#B49BFF', motif: '#FFFFFF', motif2: '#FF8FAB', ribbon: '#FF8FAB', ribbonSheen: '#FFD6E2', pattern: 'doodles', glow: '#FFFFFF' },
    cake: { side: '#B49BFF', icing: '#FFF0F6', sponge: '#F9E4EE', filling: '#FF8FAB', accent: '#FF5D9E', sprinkles: ['#7C5CFF', '#FF8FAB', '#5EEAD4', '#FFD166'], topper: 'cherry' },
    letter: { envelope: '#B49BFF', lining: '#FFE3EE', liningMotif: '#7C5CFF', wax: '#FF5D9E', paper: '#FFFDFF', ink: '#2C2350', accent: '#7C5CFF', pattern: 'doodles' },
    vars: {
      '--bg': '#F5F0FF',
      '--surface': '#FDFBFF',
      '--sidebar': '#E9E0FF',
      '--border': '#D7C9FA',
      '--ink': '#241B3D',
      '--ink-soft': '#41356A',
      '--muted': '#7B6FA3',
      '--accent': '#7C5CFF',
      '--accent-hover': '#6644E8',
      '--accent-soft': '#D7C9FA',
      '--secondary': '#FF8FAB',
      '--on-accent': '#FFFFFF',
      '--story-mesh':
        'radial-gradient(60% 40% at 10% 8%, rgba(255,143,171,.45), transparent 70%), radial-gradient(60% 45% at 92% 92%, rgba(94,234,212,.40), transparent 70%), linear-gradient(180deg,#F5F0FF 0%,#EAE1FF 100%)',
    },
    gate: {
      hopeful: 'made something. No reason.',
      hopefulSub: 'Just this. Just for you.',
      refusedOnce: 'Bold of you.',
      refusedOnceSub: 'Pip pretends to be fine.',
      declined: 'Pip has fainted, dramatically.',
      declinedSub: 'A tiny violin plays it out.',
      yes: 'Fine, show me',
    },
  },
};

const FALLBACK: MomentId = 'birthday';

export function isMomentId(value: string): value is MomentId {
  return value in THEMES;
}

const WHITE = '#FFFFFF';
const BLACK = '#000000';
const NIGHT = '#1A1210';

/**
 * A festival's story look, built from its colour family: its accent and second colour become the
 * gift paper, the ribbon, the confetti and the page wash, so each festival has its own colours
 * without 50 hand-made themes. It borrows "just because" for what a festival does not change
 * (the candle cake is never shown, since festivals have no candle scene).
 */
function buildHolidayTheme(templateType: string): MomentTheme | null {
  const holiday = webHolidayFor(templateType);
  if (!holiday) return null;
  const look = HOLIDAY_LOOKS[holiday.look];
  const { accent, accentSecondary: gold, softBackground: soft, orbPrimary, orbSecondary } = look;
  const ink = mix(accent, NIGHT, 0.82);
  const label = holiday.label;
  const art = festivalStyleFor(templateType);
  return {
    id: 'just_because',
    songType: templateType,
    label,
    festival: art ?? undefined,
    dark: false,
    backdrop: art ? 'festival' : look.backdrop,
    fx: art?.fx ?? look.fx,
    costume: (art?.costume ?? look.costume) as Costume,
    mascot: { light: mix(gold, WHITE, 0.45), base: gold, shade: mix(gold, BLACK, 0.2), cheek: accent },
    palette: [accent, gold, orbPrimary, orbSecondary, mix(accent, WHITE, 0.4), mix(gold, WHITE, 0.5)],
    starName: 'wishes',
    gift: {
      paper: accent,
      motif: WHITE,
      motif2: gold,
      ribbon: gold,
      ribbonSheen: mix(gold, WHITE, 0.6),
      pattern: look.pattern,
      glow: gold,
    },
    cake: THEMES.just_because.cake,
    letter: {
      envelope: mix(accent, WHITE, 0.55),
      lining: soft,
      liningMotif: gold,
      wax: mix(accent, BLACK, 0.25),
      paper: '#FFFDF8',
      ink,
      accent,
      pattern: look.pattern,
    },
    vars: {
      '--bg': mix(soft, WHITE, 0.4),
      '--surface': mix(soft, WHITE, 0.75),
      '--sidebar': soft,
      '--border': mix(orbPrimary, WHITE, 0.35),
      '--ink': ink,
      '--ink-soft': mix(accent, NIGHT, 0.68),
      '--muted': mix(ink, WHITE, 0.45),
      '--accent': accent,
      '--accent-hover': mix(accent, BLACK, 0.15),
      '--accent-soft': mix(accent, WHITE, 0.72),
      '--secondary': gold,
      '--on-accent': WHITE,
      '--story-mesh': `radial-gradient(70% 45% at 12% 4%, ${withAlpha(orbPrimary, 0.55)}, transparent 70%), radial-gradient(60% 40% at 92% 10%, ${withAlpha(orbSecondary, 0.5)}, transparent 70%), radial-gradient(80% 50% at 50% 100%, ${withAlpha(gold, 0.3)}, transparent 70%), linear-gradient(180deg, ${mix(soft, WHITE, 0.5)} 0%, ${soft} 100%)`,
    },
    gate: {
      hopeful: 'has a wish for you',
      hopefulSub: `A ${label} wish, just for you.`,
      refusedOnce: 'Not even a quick look?',
      refusedOnceSub: 'Pip will wait, politely.',
      declined: 'Pip is a little sad now.',
      declinedSub: 'Pip will be fine. Probably.',
      yes: 'Open it',
    },
  };
}

const holidayThemes = new Map<string, MomentTheme | null>();

/**
 * A moment's own look; a festival's look from its colours; anything else (sorry, proposal...)
 * falls back to birthday's.
 */
export function momentThemeFor(templateType: string): MomentTheme {
  if (isMomentId(templateType)) return THEMES[templateType];
  if (!holidayThemes.has(templateType)) holidayThemes.set(templateType, buildHolidayTheme(templateType));
  return holidayThemes.get(templateType) ?? THEMES[FALLBACK];
}

export function allMomentThemes(): MomentTheme[] {
  return Object.values(THEMES);
}
