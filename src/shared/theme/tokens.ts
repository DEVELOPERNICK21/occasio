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
