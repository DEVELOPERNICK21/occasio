import {
  excerptOf,
  firstNameOf,
  MAX_STORY_STARS,
  STORY_FRAME_VERSION,
  parseStoryFrameParams,
  storyChips,
  storyFrameCopy,
  storyGlimpse,
  storyHeadlineSize,
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

  it('carries the design version, so a redesign is never hidden behind a cached picture', () => {
    expect(storyFramePath({ occasion: 'birthday', found: 0, of: 0 })).toContain(`v=${STORY_FRAME_VERSION}`);
  });

  it('adds the card only when asked, and keeps an odd slug from breaking the address', () => {
    const params = { occasion: 'birthday' as const, found: 1, of: 2 };
    expect(storyFramePath(params)).not.toContain('slug=');
    expect(storyFramePath(params, null)).not.toContain('slug=');
    expect(storyFramePath(params, 'abc123')).toContain('slug=abc123');
    expect(storyFramePath(params, 'a b&c')).toContain('slug=a+b%26c');
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

describe('firstNameOf', () => {
  it('keeps only the first name', () => {
    expect(firstNameOf('Aarav Sharma')).toBe('Aarav');
    expect(firstNameOf('  Maya  ')).toBe('Maya');
  });

  it('gives nothing for an empty or missing name', () => {
    expect(firstNameOf('')).toBeNull();
    expect(firstNameOf('   ')).toBeNull();
    expect(firstNameOf(null)).toBeNull();
    expect(firstNameOf(undefined)).toBeNull();
  });

  it('cuts a very long name instead of letting it break the picture', () => {
    expect(Array.from(firstNameOf('Bartholomewbartholomewbartholomew')!).length).toBeLessThanOrEqual(18);
  });
});

describe('excerptOf', () => {
  it('shows a short message whole', () => {
    expect(excerptOf('Happy birthday, I love you.')).toBe('Happy birthday, I love you.');
  });

  it('cuts a long one at a word and ends it so there is clearly more', () => {
    const text = excerptOf(
      'Priya, I still remember the first time we met at that tiny cafe, and how you laughed at my terrible joke.',
    )!;
    expect(text.endsWith('\u2026')).toBe(true);
    expect(Array.from(text).length).toBeLessThanOrEqual(73);
    expect(text).not.toMatch(/\s\u2026$/);
    expect('Priya, I still remember the first time we met at that tiny cafe, and how you laughed').toContain(
      text.slice(0, -1),
    );
  });

  it('squashes line breaks and spaces', () => {
    expect(excerptOf('Hello\n\n   there')).toBe('Hello there');
  });

  it('never splits an emoji', () => {
    const text = excerptOf('x'.repeat(70) + '\u{1F389}\u{1F389}\u{1F389} and more words after')!;
    expect(text).not.toMatch(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/);
  });

  it('gives nothing for an empty message', () => {
    expect(excerptOf('')).toBeNull();
    expect(excerptOf('   ')).toBeNull();
    expect(excerptOf(null)).toBeNull();
  });

  it('leaves out anything that looks private: links, email addresses, long numbers', () => {
    expect(excerptOf('Call me on 9876543210 tonight')).toBeNull();
    expect(excerptOf('Mail me at maya@example.com')).toBeNull();
    expect(excerptOf('See https://example.com/photos')).toBeNull();
    expect(excerptOf('Visit www.example.com')).toBeNull();
    expect(excerptOf('Born in 1998 and still my favourite')).not.toBeNull();
  });
});

describe('storyGlimpse', () => {
  it('counts what is in the card and takes only the first name', () => {
    expect(
      storyGlimpse({
        message: 'You are so special.',
        fromName: 'Aarav Sharma',
        mediaUrls: ['a', 'b', ' '],
        reasons: ['one', 'two', ''],
      }),
    ).toEqual({ fromFirstName: 'Aarav', excerpt: 'You are so special.', photos: 2, reasons: 2 });
  });

  it('copes with a card that has none of it', () => {
    expect(storyGlimpse({})).toEqual({ fromFirstName: null, excerpt: null, photos: 0, reasons: 0 });
  });
});

describe('storyChips', () => {
  const glimpse = { fromFirstName: 'Aarav', excerpt: null, photos: 5, reasons: 6 };

  it('lists photos, reasons and the stars, three at most', () => {
    expect(storyChips(glimpse, 5, 6)).toEqual(['5 photos', '6 reasons', '5 of 6 stars found']);
  });

  it('says one photo and one reason in the singular', () => {
    expect(storyChips({ ...glimpse, photos: 1, reasons: 1 }, 0, 0)).toEqual(['1 photo', '1 reason']);
  });

  it('is only the stars without a peek, and empty with nothing to say', () => {
    expect(storyChips(null, 2, 6)).toEqual(['2 of 6 stars found']);
    expect(storyChips(null, 0, 0)).toEqual([]);
  });
});

describe('the picture with a peek', () => {
  const glimpse = { fromFirstName: 'Aarav', excerpt: 'You are so special.', photos: 2, reasons: 3 };
  const params = { occasion: 'birthday' as const, found: 2, of: 6 };

  it('names who made it, in the headline and on the little card', () => {
    const copy = storyFrameCopy(params, glimpse);
    expect(copy.headline).toBe('Aarav made me a birthday surprise');
    expect(copy.signature).toBe('With love, Aarav');
    expect(copy.excerpt).toBe('You are so special.');
  });

  it('has a named headline for every moment, each written as "me"', () => {
    for (const occasion of OCCASIONS) {
      const copy = storyFrameCopy({ occasion, found: 0, of: 0 }, glimpse);
      expect(copy.headline.startsWith('Aarav')).toBe(true);
      expect(copy.headline).toMatch(/\bme\b/);
    }
  });

  it('is the plain picture without a peek: nobody named, nothing quoted', () => {
    const copy = storyFrameCopy(params, null);
    expect(copy.headline).toBe('Someone made me a birthday wish');
    expect(copy.signature).toBeNull();
    expect(copy.excerpt).toBeNull();
  });

  it('stays calm with a peek too: no exclamation marks, no emoji', () => {
    for (const occasion of OCCASIONS) {
      const copy = storyFrameCopy({ occasion, found: 3, of: 6 }, glimpse);
      for (const text of [copy.headline, copy.signature ?? '', ...copy.chips]) {
        expect(text).not.toContain('!');
        expect(text).not.toMatch(/\p{Extended_Pictographic}/u);
      }
    }
  });
});

describe('storyHeadlineSize', () => {
  it('shrinks the longer headlines so none runs past two lines', () => {
    expect(storyHeadlineSize('Someone made me a birthday wish')).toBe(76);
    expect(storyHeadlineSize('Maya made me a thank-you')).toBe(88);
    expect(storyHeadlineSize('Bartholomewbartho made me an anniversary surprise')).toBe(66);
  });
});
