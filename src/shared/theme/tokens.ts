/**
 * Design tokens — keep in sync with /design-tokens.json (Stitch + docs).
 */
export const colors = {
  /** Stitch primary — coral */
  primary: '#E8615D',
  secondary: '#F6A94A',
  tertiary: '#F7C9B6',
  neutral: '#857371',
  bg: '#FDF6F2',
  surface: '#FFFFFF',
  sidebar: '#FCEEE8',
  ink: '#2A2220',
  inkSoft: '#4D4340',
  muted: '#857371',
  border: '#EDD5CA',
  accent: '#E8615D',
  accentSoft: '#F7C9B6',
  accentHover: '#C94E4A',
  error: '#B42318',
  errorSoft: '#FEE4E2',
  success: '#027A48',
  white: '#FFFFFF',
  /** Celebration palette — occasion accents already used in templateTheme. */
  rose: '#E07A8A',
  roseSoft: '#FCE3E8',
  amberSoft: '#FDEBD0',
  sage: '#5B7A6E',
  sageSoft: '#DCEBE4',
  butter: '#F9D56E',
  butterSoft: '#FFF4D1',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const typography = {
  sizeXs: 12,
  sizeSm: 14,
  sizeMd: 16,
  sizeLg: 20,
  sizeXl: 28,
  size2xl: 34,
  weightRegular: '400' as const,
  weightMedium: '500' as const,
  weightSemibold: '600' as const,
  /** Plus Jakarta Sans — system fallback until custom fonts ship. */
  fontDisplay: 'System',
  fontBody: 'System',
} as const;

export const shadow = {
  card: {
    shadowColor: '#2A2220',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
  },
} as const;

/** The dim behind a blocking dialog, such as the mascot's busy screen. */
export const overlay = {
  scrim: 'rgba(28, 25, 20, 0.45)',
} as const;

/**
 * Materials the card frames imitate: film stock, notebook paper, grease pencil.
 * Artwork colours rather than UI palette colours, so they are not part of
 * design-tokens.json.
 */
export const frameArt = {
  film: '#171210',
  filmEdge: '#F0A24B',
  filmHole: '#F6EDE4',
  pencil: '#D4372C',
  paper: '#FBF4E6',
  paperRule: '#CBD9E6',
  paperMargin: '#E7A4A0',
  stampInk: '#9C3D38',
  sepia: 'rgba(140, 92, 48, 0.14)',
  boothCurtain: '#B8403C',
} as const;

/**
 * Pip, the Occasio mascot. These are artwork colours (the same orange body the
 * recipient web page uses for the birthday moment), not UI colours, so they
 * live here and are not part of design-tokens.json.
 */
export const mascot = {
  light: '#FFB27A',
  base: '#FF8A4C',
  shade: '#E2622B',
  cheek: '#FF5D7A',
  ink: '#2B1B2E',
  mouth: '#5B1F2E',
  tongue: '#FF7A93',
  tear: '#7CC8FF',
  hatRed: '#FF4D6D',
  hatBand: '#FFD166',
  hatBlue: '#3A86FF',
  hatBrim: '#FFB703',
  giftPaper: '#FF6B7A',
  giftRibbon: '#FFD166',
} as const;
