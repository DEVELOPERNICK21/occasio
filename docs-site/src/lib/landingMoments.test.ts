import { LANDING_MOMENTS, sampleWishPath } from './landingMoments';
import { parseDemoSlug } from './recipientCard';

describe('landing sample wishes', () => {
  it('every landing moment opens a real story demo for that moment', () => {
    for (const moment of LANDING_MOMENTS) {
      const slug = sampleWishPath(moment.id).replace('/c/', '');
      const card = parseDemoSlug(slug);

      expect(card).not.toBeNull();
      expect(card?.templateType).toBe(moment.id);
      expect(card?.experienceMode).toBe('story');
      expect(card?.recipientName).toBe('Maya');
    }
  });

  it('offers all five moments, once each', () => {
    const ids = LANDING_MOMENTS.map((moment) => moment.id);
    expect(new Set(ids).size).toBe(5);
  });
});
