import {
  isInteractiveExperience,
  resolveDraftExperienceMode,
} from '../../src/features/create/domain/experienceMode';

describe('isInteractiveExperience', () => {
  it('true for birthday and anniversary', () => {
    expect(isInteractiveExperience('birthday')).toBe(true);
    expect(isInteractiveExperience('anniversary')).toBe(true);
  });

  it('false otherwise', () => {
    expect(isInteractiveExperience('thank_you')).toBe(false);
    expect(isInteractiveExperience(null)).toBe(false);
  });
});

describe('resolveDraftExperienceMode', () => {
  it('honors explicit override', () => {
    expect(resolveDraftExperienceMode('birthday', 'classic')).toBe('classic');
    expect(resolveDraftExperienceMode('thank_you', 'story')).toBe('story');
  });

  it('defaults from occasion when null', () => {
    expect(resolveDraftExperienceMode('birthday', null)).toBe('story');
    expect(resolveDraftExperienceMode('thank_you', null)).toBe('classic');
  });
});
