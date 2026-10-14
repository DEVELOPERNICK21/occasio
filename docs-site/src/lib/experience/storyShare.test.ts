import {
  MAX_STORY_STARS,
  parseStoryFrameParams,
  storyFrameCopy,
  storyFramePath,
  storyLandingUrl,
  storyOccasionFor,
  storyScoreLine,
  storyShareCaption,
  type StoryOccasion,
} from './storyShare';

const parse = (query: string) => parseStoryFrameParams(new URLSearchParams(query));
const OCCASIONS: StoryOccasion[] = ['birthday', 'anniversary', 'thank_you', 'congratulations', 'just_because'];

describe('storyOccasionFor', () => {
  it('keeps the five moments and gives every other card the birthday look', () => {
    for (const occasion of OCCASIONS) expect(storyOccasionFor(occasion)).toBe(occasion);
    expect(storyOccasionFor('sorry')).toBe('birthday');
    expect(storyOccasionFor('proposal')).toBe('birthday');
    expect(storyOccasionFor('')).toBe('birthday');
  });
});

describe('parseStoryFrameParams', () => {
  it('reads the occasion and the score', () => {
    expect(parse('occasion=anniversary&found=3&of=6')).toEqual({ occasion: 'anniversary', found: 3, of: 6 });
  });

  it('makes anything odd safe instead of refusing it', () => {
    expect(parse('')).toEqual({ occasion: 'birthday', found: 0, of: 0 });
    expect(parse('occasion=<script>&found=abc&of=-4')).toEqual({ occasion: 'birthday', found: 0, of: 0 });
  });

  it('never reports more stars than there were, or more than the cap', () => {
    expect(parse('found=9&of=6').found).toBe(6);
    expect(parse('found=99999&of=99999')).toMatchObject({ found: MAX_STORY_STARS, of: MAX_STORY_STARS });
  });

  it('has only a few hundred possible pictures, so each can be cached for good', () => {
    // 5 occasions x every (found, of) pair up to the cap.
    const pairs = Array.from({ length: MAX_STORY_STARS + 1 }, (_, of) => of + 1).reduce((a, b) => a + b, 0);
    expect(OCCASIONS.length * pairs).toBeLessThan(1000);
  });
});

describe('storyFramePath', () => {
  it('round-trips through the parser', () => {
    const params = { occasion: 'thank_you' as const, found: 4, of: 5 };
    const path = storyFramePath(params);
    expect(path.startsWith('/api/story-frame?')).toBe(true);
    expect(parse(path.split('?')[1]!)).toEqual(params);
  });
});

describe('storyScoreLine', () => {
  it('says how many stars were found, and celebrates all of them', () => {
    expect(storyScoreLine(5, 6)).toBe('5 of 6 stars found');
    expect(storyScoreLine(6, 6)).toBe('Every star found');
  });

  it('says nothing when there is no score worth showing', () => {
    expect(storyScoreLine(0, 6)).toBeNull();
    expect(storyScoreLine(3, 0)).toBeNull();
  });
});

describe('the words on the picture and in the caption', () => {
  const words = OCCASIONS.flatMap((occasion) => {
    const copy = storyFrameCopy({ occasion, found: 2, of: 6 });
    return [copy.eyebrow, copy.headline, copy.score ?? '', copy.cta, storyShareCaption(occasion, 'https://x.test/?ref=abc')];
  });

  it('has a headline for every moment, and they differ', () => {
    const headlines = OCCASIONS.map((occasion) => storyFrameCopy({ occasion, found: 0, of: 0 }).headline);
    expect(new Set(headlines).size).toBe(OCCASIONS.length);
  });

  it('is calm: no exclamation marks, no emoji', () => {
    for (const text of words) {
      expect(text).not.toContain('!');
      expect(text).not.toMatch(/\p{Extended_Pictographic}/u);
    }
  });

  it('is written for the person who got the card, and names nobody', () => {
    for (const occasion of OCCASIONS) {
      const copy = storyFrameCopy({ occasion, found: 2, of: 6 });
      expect(copy.headline).toMatch(/\bme\b|\bmy\b/i);
    }
  });

  it('puts the public link in the caption, once', () => {
    const caption = storyShareCaption('birthday', 'https://occasio.test/?ref=abc123');
    expect(caption).toContain('https://occasio.test/?ref=abc123');
    expect(caption.match(/https:/g)).toHaveLength(1);
  });
});

describe('storyLandingUrl', () => {
  it('points at the public landing page with the card it came from, never at the card', () => {
    expect(storyLandingUrl('https://occasio.test', 'abc123')).toBe('https://occasio.test/?ref=abc123');
    expect(storyLandingUrl('https://occasio.test/', 'abc123')).not.toContain('/c/');
  });

  it('keeps an odd slug from breaking the address', () => {
    expect(storyLandingUrl('https://occasio.test', 'a b&c')).toBe('https://occasio.test/?ref=a%20b%26c');
  });
});
