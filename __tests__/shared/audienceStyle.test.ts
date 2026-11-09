import { AUDIENCE_OPTIONS } from '../../src/features/create/domain/audienceOccasion';
import { audienceIcon, audienceTone } from '../../src/shared/ui/audienceStyle';

describe('audienceStyle', () => {
  it('gives every audience of the create flow its own look, so a new audience cannot quietly fall back', () => {
    const fallback = audienceTone('not-an-audience');
    for (const { id } of AUDIENCE_OPTIONS) {
      if (id === 'someone_special') continue;
      expect([id, audienceTone(id)]).not.toEqual([id, fallback]);
    }
    expect(new Set(AUDIENCE_OPTIONS.map(({ id }) => audienceIcon(id))).size).toBe(AUDIENCE_OPTIONS.length);
  });

  it('uses the "someone special" look for an id it does not know', () => {
    expect(audienceTone('unknown')).toBe(audienceTone('someone_special'));
    expect(audienceIcon('unknown')).toBe(audienceIcon('someone_special'));
  });
});
