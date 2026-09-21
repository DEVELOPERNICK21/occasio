import {
  isInteractiveExperience,
  resolveDraftExperienceMode,
  storyBeatHint,
} from '../../src/features/create/domain/experienceMode';

describe('isInteractiveExperience', () => {
  it('true for all five create-flow moments', () => {
    expect(isInteractiveExperience('birthday')).toBe(true);
    expect(isInteractiveExperience('anniversary')).toBe(true);
    expect(isInteractiveExperience('thank_you')).toBe(true);
    expect(isInteractiveExperience('congratulations')).toBe(true);
    expect(isInteractiveExperience('just_because')).toBe(true);
  });

  it('false for null and legacy-only types', () => {
    expect(isInteractiveExperience(null)).toBe(false);
    expect(isInteractiveExperience('sorry')).toBe(false);
  });
});

describe('resolveDraftExperienceMode', () => {
  it('honors explicit override', () => {
    expect(resolveDraftExperienceMode('birthday', 'classic')).toBe('classic');
    expect(resolveDraftExperienceMode('thank_you', 'classic')).toBe('classic');
  });

  it('defaults to story for every create-flow moment', () => {
    expect(resolveDraftExperienceMode('birthday', null)).toBe('story');
    expect(resolveDraftExperienceMode('thank_you', null)).toBe('story');
    expect(resolveDraftExperienceMode('congratulations', null)).toBe('story');
    expect(resolveDraftExperienceMode('just_because', null)).toBe('story');
  });
});

describe('storyBeatHint', () => {
  it('includes candle for birthday and anniversary', () => {
    expect(storyBeatHint('birthday')).toContain('candle');
    expect(storyBeatHint('anniversary')).toContain('candle');
  });

  it('skips candle for thank you and congratulations', () => {
    expect(storyBeatHint('thank_you')).not.toContain('candle');
    expect(storyBeatHint('congratulations')).not.toContain('candle');
  });
});
