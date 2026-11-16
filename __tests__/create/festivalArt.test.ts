import { execFileSync } from 'child_process';
import path from 'path';
import appMotifs from '../../src/shared/ui/art/festivalMotifs.json';
import appArt from '../../src/features/create/domain/festivalArtData.json';
import webMotifs from '../../docs-site/src/lib/festivalMotifs.json';
import webArt from '../../docs-site/src/lib/festivalArtData.json';
import { FESTIVAL_ART_IDS, festivalArtFor, ornamentMotifs } from '../../src/features/create/domain/festivalArt';
import { HOLIDAYS } from '../../src/features/create/domain/holidays';
import { momentThemeFor, festivalStyleFor } from '../../docs-site/src/lib/experience/momentTheme';
import { tapModeFor, tapTitle } from '../../docs-site/src/lib/experience/festivalTaps';
import { storyCopyFor } from '../../docs-site/src/lib/experience/storyCopy';

type Shape = Record<string, unknown> & { k: string; lit?: number; dim?: number };
const motifs = appMotifs.motifs as unknown as Record<string, Shape[]>;
const festivals = appArt.festivals as unknown as Record<string, { hero: string; extras: string[]; taps: string[]; garland: string | null; ambient: Array<{ motif: string }>; costume: string }>;
const hex = /^#[0-9a-f]{6}$/i;

describe('the festival drawings', () => {
  it('are the same file in the app and on the recipient page, and up to date with the script that draws them', () => {
    expect(webMotifs).toEqual(appMotifs);
    expect(webArt).toEqual(appArt);
    const script = path.resolve(__dirname, '../../scripts/art/festival-motifs.mjs');
    expect(() => execFileSync('node', [script, '--check'], { stdio: 'pipe' })).not.toThrow();
  });

  it('are made only of shapes both renderers know, with real colours and numbers', () => {
    for (const [id, shapes] of Object.entries(motifs)) {
      expect(shapes.length).toBeGreaterThan(1);
      for (const shape of shapes) {
        expect(['p', 'c', 'e', 'r']).toContain(shape.k);
        for (const key of ['f', 's']) {
          const colour = shape[key];
          if (colour !== undefined) expect(colour === 'none' || hex.test(String(colour))).toBe(true);
        }
        for (const value of Object.values(shape)) if (typeof value === 'number') expect(Number.isFinite(value)).toBe(true);
        if (shape.k === 'p') expect(String(shape.d)).not.toMatch(/NaN|undefined/);
      }
      expect({ id, hasPicture: shapes.some((s) => !s.lit && !s.dim) }).toEqual({ id, hasPicture: true });
    }
  });
});

describe('what each festival is drawn with', () => {
  it('covers every festival, once, using only drawings that exist', () => {
    expect([...FESTIVAL_ART_IDS].sort()).toEqual(HOLIDAYS.map((h) => h.id).sort());
    for (const [id, art] of Object.entries(festivals)) {
      const used = [art.hero, ...art.extras, ...art.taps, ...(art.garland ? [art.garland] : []), ...art.ambient.map((a) => a.motif)];
      for (const motif of used) expect({ id, motif, exists: motif in motifs }).toEqual({ id, motif, exists: true });
      expect(art.taps).toHaveLength(4);
    }
  });

  it('gives Christmas its Santa, tree and stars, and Diwali its diya and crackers, as asked', () => {
    const christmas = festivalArtFor('christmas')!;
    expect([christmas.hero, ...christmas.extras]).toEqual(expect.arrayContaining(['santa', 'tree', 'star']));
    expect(christmas.taps).toEqual(expect.arrayContaining(['tree', 'star', 'santa']));
    expect(christmas.costume).toBe('santa_hat');
    expect(christmas.fx).toBe('snow');
    const diwali = festivalArtFor('diwali')!;
    expect([diwali.hero, ...diwali.extras]).toEqual(expect.arrayContaining(['diya', 'rocket', 'anar', 'rangoli']));
    expect(diwali.taps).toEqual(expect.arrayContaining(['diya', 'rocket', 'anar']));
    expect(diwali.costume).toBe('head:diya');
    const halloween = festivalArtFor('halloween')!;
    expect([halloween.hero, ...halloween.extras]).toEqual(expect.arrayContaining(['pumpkin', 'ghost', 'bat']));
    expect(festivalArtFor('holi')!.fx).toBe('powder');
    expect(festivalArtFor('birthday')).toBeNull();
    expect(festivalArtFor(null)).toBeNull();
  });

  it('only asks for something to light up when the drawing has a light to switch on', () => {
    for (const [id, art] of Object.entries(festivals)) {
      for (const motif of art.taps) {
        if (tapModeFor(motif) === 'light') {
          expect({ id, motif, lights: motifs[motif]!.some((s) => s.lit || s.dim) }).toEqual({ id, motif, lights: true });
        }
      }
    }
  });

  it('picks the corner drawings, the face first', () => {
    expect(ornamentMotifs('diwali')).toEqual(['diya', 'rocket', 'anar']);
    expect(ornamentMotifs('diwali', 1)).toEqual(['diya']);
    expect(ornamentMotifs('birthday')).toEqual([]);
  });
});

describe('the recipient page uses them', () => {
  it('dresses each festival story in its own drawings, costume and finale', () => {
    for (const holiday of HOLIDAYS) {
      const theme = momentThemeFor(holiday.id);
      const art = festivals[holiday.id]!;
      expect(theme.festival).toEqual(festivalStyleFor(holiday.id));
      expect(theme.backdrop).toBe('festival');
      expect(theme.costume).toBe(art.costume);
      expect(theme.fx).toBe((art as unknown as { fx: string }).fx);
      expect(theme.costume).toMatch(/^(party_hat|rose|flower_crown|medal|shades|santa_hat|witch_hat|bunny_ears|holi_colour|head:\w+|held:\w+)$/);
    }
    expect(momentThemeFor('birthday').festival).toBeUndefined();
  });

  it('names the tapping scene by what the first thing does', () => {
    expect(tapModeFor('diya')).toBe('light');
    expect(tapModeFor('rocket')).toBe('burst');
    expect(tapModeFor('splash')).toBe('splash');
    expect(tapModeFor('modak')).toBe('pop');
    expect(storyCopyFor('diwali').balloonsTitle).toBe('Light up Diwali');
    expect(storyCopyFor('holi').balloonsTitle).toBe('Play Holi');
    expect(storyCopyFor('christmas').balloonsTitle).toBe('Light up Christmas');
    expect(storyCopyFor('makar_sankranti').balloonsTitle).toBe('Pop for Makar Sankranti');
    expect(tapTitle('Eid al-Fitr', 'lantern')).toBe('Light up Eid al-Fitr');
    expect(storyCopyFor('birthday').balloonsTitle).toBe('Pop the balloons');
  });
});
