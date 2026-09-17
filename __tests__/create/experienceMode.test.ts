import { isInteractiveExperience } from '../../src/features/create/domain/experienceMode';

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
