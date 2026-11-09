import { DESIGNS, OCCASIONS, OCCASION_INFO } from './invitation';
import { DESIGN_THEMES, THEMES, eventKind, themeFor, themeVars } from './invitationTheme';

/** WCAG relative luminance of a `#rrggbb` colour. */
function luminance(hex: string): number {
  const channel = (shift: number) => {
    const value = ((parseInt(hex.slice(1), 16) >> shift) & 255) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(16) + 0.7152 * channel(8) + 0.0722 * channel(0);
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

describe('invitation themes', () => {
  it('has a look for every occasion, and ceremonies are regal while the rest are party', () => {
    for (const occasion of OCCASIONS) {
      expect(themeFor(occasion)).toBe(THEMES[occasion]);
    }
    expect(OCCASIONS.filter((o) => THEMES[o].family === 'regal')).toEqual(['wedding', 'engagement', 'anniversary']);
    // The ceremonies are the couples: they share the regal look and its two-name layout.
    expect(OCCASIONS.filter((o) => OCCASION_INFO[o].couple)).toEqual(['wedding', 'engagement', 'anniversary']);
  });

  it('dresses a ceremony in the design asked for, and leaves every other occasion alone', () => {
    expect(themeFor('wedding', 'sage')).toBe(DESIGN_THEMES.sage);
    expect(themeFor('engagement', 'palace')).toBe(DESIGN_THEMES.palace);
    expect(themeFor('anniversary', 'sage').look).toBe('sage');
    expect(themeFor('wedding', 'regal')).toBe(THEMES.wedding);
    expect(themeFor('wedding')).toBe(THEMES.wedding);
    expect(themeFor('birthday', 'sage')).toBe(THEMES.birthday);
    expect(themeFor('party', 'palace').look).toBe('party');
  });

  it('gives each design its own entrance, game and words', () => {
    const looks = DESIGNS.map((design) => themeFor('wedding', design).look);
    expect(looks).toEqual(['regal', 'sage', 'palace']);
    const tokens = DESIGNS.map((design) => themeFor('wedding', design).copy.token);
    expect(new Set(tokens).size).toBe(3);
    expect(tokens).toEqual(['garland', 'card', 'window']);
    for (const design of DESIGNS) {
      const { copy } = themeFor('wedding', design);
      expect(copy.tokens).toBe(`${copy.token}s`);
      expect(copy.tokenIntro.toLowerCase()).toContain(copy.token);
    }
  });

  it('keeps white text readable on every button colour, and body text readable on every page', () => {
    const palettes = [
      ...OCCASIONS.map((occasion) => THEMES[occasion].palette),
      DESIGN_THEMES.sage.palette,
      DESIGN_THEMES.palace.palette,
    ];
    for (const palette of palettes) {
      expect(contrast('#ffffff', palette.primary)).toBeGreaterThanOrEqual(4.5);
      expect(contrast('#ffffff', palette.primaryDeep)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(palette.ink, palette.bg)).toBeGreaterThanOrEqual(7);
      expect(contrast(palette.muted, palette.bg)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('gives every look enough confetti colours and valid hex values', () => {
    for (const occasion of OCCASIONS) {
      const { palette } = THEMES[occasion];
      expect(palette.confetti.length).toBeGreaterThanOrEqual(4);
      for (const colour of [...palette.confetti, palette.bg, palette.paper, palette.primary, palette.pop, palette.accent]) {
        expect(colour).toMatch(/^#[0-9a-fA-F]{6}$/);
      }
    }
  });

  it('words the game for each look: garlands are hung, cards turned, windows opened, stars collected', () => {
    expect(`${THEMES.wedding.copy.tokenDo} the ${THEMES.wedding.copy.token}`).toBe('Hang the garland');
    expect(`${themeFor('wedding', 'sage').copy.tokenDo} the ${themeFor('wedding', 'sage').copy.token}`).toBe('Turn the card');
    expect(`${themeFor('wedding', 'palace').copy.tokenDo} the ${themeFor('wedding', 'palace').copy.token}`).toBe('Open the window');
    expect(`${THEMES.birthday.copy.tokenDo} the ${THEMES.birthday.copy.token}`).toBe('Collect the star');
    for (const occasion of OCCASIONS) {
      const { copy } = THEMES[occasion];
      expect(copy.tokens).toBe(`${copy.token}s`);
      expect(copy.tokenDone.length).toBeGreaterThan(10);
    }
  });

  it('turns a palette into the custom properties the page reads', () => {
    const vars = themeVars(THEMES.birthday.palette);
    expect(vars['--primary']).toBe('#c8431c');
    expect(Object.keys(vars).every((key) => key.startsWith('--'))).toBe(true);
  });
});

describe('eventKind', () => {
  it('picks a picture from the words of an event', () => {
    expect(eventKind('Mehendi')).toBe('henna');
    expect(eventKind('Sangeet night')).toBe('music');
    expect(eventKind('Haldi')).toBe('turmeric');
    expect(eventKind('Ring ceremony')).toBe('ring');
    expect(eventKind('Griha pravesh puja')).toBe('puja');
    expect(eventKind('Wedding')).toBe('ceremony');
    expect(eventKind('Reception')).toBe('dinner');
    expect(eventKind('Cake')).toBe('cake');
    expect(eventKind('Games and music')).toBe('music');
    expect(eventKind('Something else')).toBe('other');
  });
});
