/**
 * Design tokens — keep in sync with /design-tokens.json (Stitch + docs).
 */
export const colors = {
  bg: '#F6F1E8',
  surface: '#FFFDF8',
  ink: '#1C1914',
  inkSoft: '#3D3830',
  muted: '#6F675C',
  border: '#DDD2C0',
  accent: '#1F5C4D',
  accentSoft: '#D8EBE4',
  accentHover: '#174A3E',
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
};
