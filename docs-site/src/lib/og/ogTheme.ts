import { momentThemeFor } from '../experience/momentTheme';

/** The colours the preview image needs, taken from the moment's own theme so each one looks like itself. */
export type OgTheme = {
  bgTop: string;
  bgBottom: string;
  accent: string;
  /** Darker accent: the button, which carries white text. */
  accentDeep: string;
  ink: string;
  inkSoft: string;
  paper: string;
  ribbon: string;
  confetti: string[];
  mascot: { light: string; base: string; shade: string; cheek: string };
};

export function ogThemeFor(templateType: string): OgTheme {
  const theme = momentThemeFor(templateType);
  const { vars, gift } = theme;
  return {
    bgTop: vars['--bg']!,
    bgBottom: vars['--accent-soft']!,
    accent: vars['--accent']!,
    accentDeep: vars['--accent-hover']!,
    ink: vars['--ink']!,
    inkSoft: vars['--ink-soft']!,
    paper: gift.paper,
    ribbon: gift.ribbon,
    confetti: theme.palette,
    mascot: theme.mascot,
  };
}

/** Mixes `hex` toward `toward` by `amount` (0 to 1): for lids, highlights and shadows. */
export function mix(hex: string, toward: string, amount: number): string {
  const a = parseInt(hex.slice(1), 16);
  const b = parseInt(toward.slice(1), 16);
  const channel = (shift: number) => {
    const from = (a >> shift) & 255;
    const to = (b >> shift) & 255;
    return Math.round(from + (to - from) * amount);
  };
  return `#${[16, 8, 0].map((shift) => channel(shift).toString(16).padStart(2, '0')).join('')}`;
}
