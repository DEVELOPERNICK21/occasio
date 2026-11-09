import { HOLIDAYS } from '../../src/features/create/domain/holidays';
import { getTemplateTheme } from '../../src/features/create/domain/templateTheme';
import { effectForMoment } from '../../src/features/create/domain/occasionEffects';
import { isInteractiveExperience } from '../../src/features/create/domain/experienceMode';
import { storyCaption } from '../../src/features/create/domain/shareLink';
import { templateLabel, wishGreeting } from '../../src/features/create/domain/templates';
import { WEB_HOLIDAYS, HOLIDAY_LOOKS } from '../../docs-site/src/lib/holidays';
import { effectForTemplateType } from '../../docs-site/src/lib/occasionEffects';
import { defaultExperienceMode } from '../../docs-site/src/lib/experience/resolveExperience';
import { momentThemeFor } from '../../docs-site/src/lib/experience/momentTheme';
import { storyCopyFor } from '../../docs-site/src/lib/experience/storyCopy';
import { getWebTemplateTheme } from '../../docs-site/src/lib/templateThemes';
import { parseDemoSlug, templateLabel as webLabel, wishGreeting as webGreeting } from '../../docs-site/src/lib/recipientCard';
import { songFor } from '../../docs-site/src/lib/experience/occasionSongs';

/**
 * The app and the recipient's page each keep a copy of the festival list, because the page cannot
 * import from the app. These fail when one is changed and the other is not.
 */
describe('the app and the recipient page agree on every festival', () => {
  it('know the same festivals, nothing more and nothing missing', () => {
    expect(Object.keys(WEB_HOLIDAYS).sort()).toEqual(HOLIDAYS.map((h) => h.id).sort());
  });

  it.each(HOLIDAYS.map((h) => [h.id, h] as const))('%s: same name, greeting, colours and effect', (id, holiday) => {
    const web = WEB_HOLIDAYS[id]!;
    expect(web.label).toBe(holiday.label);
    expect(web.headline).toBe(holiday.headline);
    expect(web.look).toBe(holiday.look);
    expect(web.effect).toBe(holiday.effect);
    expect(web.frame).toBe(holiday.frame);

    expect(webLabel(id)).toBe(templateLabel(id));
    expect(webGreeting(id)).toBe(wishGreeting(id));
    expect(effectForTemplateType(id)).toBe(effectForMoment('just_because', id));
    expect(defaultExperienceMode(id)).toBe(isInteractiveExperience(id) ? 'story' : 'classic');

    const app = getTemplateTheme(id);
    const site = getWebTemplateTheme(id);
    expect({ ...site }).toEqual({
      label: app.label,
      kicker: app.kicker,
      accent: app.accent,
      accentSecondary: app.accentSecondary,
      softBackground: app.softBackground,
      orbPrimary: app.orbPrimary,
      orbSecondary: app.orbSecondary,
    });
    expect(HOLIDAY_LOOKS[holiday.look].accent).toBe(app.accent);
  });

  it('draws every festival with its own colours in the story, not the birthday ones', () => {
    const birthday = momentThemeFor('birthday');
    for (const holiday of HOLIDAYS) {
      const theme = momentThemeFor(holiday.id);
      expect(theme.label).toBe(holiday.label);
      expect(theme.songType).toBe(holiday.id);
      expect(theme.vars['--accent']).toBe(HOLIDAY_LOOKS[holiday.look].accent);
      expect(theme.vars['--accent']).not.toBe(birthday.vars['--accent']);
      // Every colour a scene reads must be a real colour, never "NaN" from a bad mix.
      for (const value of [...Object.values(theme.mascot), ...theme.palette, theme.gift.paper, theme.letter.wax, theme.vars['--ink']!]) {
        expect(value).toMatch(/^#[0-9a-f]{6}$/i);
      }
    }
  });

  it('plays each festival’s own effect song, and opens a sample page for it', () => {
    expect(songFor('valentines_day').file).toBe('/sounds/hearts.mp3');
    expect(songFor('diwali').file).toBe('/sounds/sparkles.mp3');
    const sample = parseDemoSlug('demo-diwali-maya-abc123');
    expect(sample?.templateType).toBe('diwali');
    expect(sample?.recipientName).toBe('Maya');
    expect(sample?.experienceMode).toBe('story');
    expect(parseDemoSlug('demo-not_a_festival-maya-abc123')?.templateType).toBe('birthday');
  });

  it('has story copy that names the festival and stays calm', () => {
    const copy = storyCopyFor('diwali');
    const text = [copy.balloonsTitle, copy.giftTitle('Maya', false), copy.giftTitle('Maya', true), copy.photosTitle, copy.envelopeTitle('Maya'), copy.letterWriteTitle].join(' ');
    expect(text).toContain('Diwali');
    expect(text).not.toContain('!');
    expect(storyCopyFor('birthday').balloonsTitle).toBe('Pop the balloons');
  });

  it('writes a share caption that names the festival', () => {
    expect(storyCaption('diwali', 'Maya', 'https://x.test/c/abc')).toBe(
      'A Diwali wish for Maya. Watch their reaction.\nhttps://x.test/c/abc',
    );
    expect(storyCaption('birthday', 'Maya', 'https://x.test/c/abc')).toContain('birthday surprise');
  });
});
