import { headlineSize, teaserFor, truncate } from './teaser';

describe('teaserFor a card', () => {
  const base = { kind: 'card' as const, greeting: 'Happy birthday,', recipientName: 'Maya', fromName: 'Sam' };

  it('names the sender and the recipient in the title, and teases without spoiling', () => {
    const teaser = teaserFor(base);
    expect(teaser.title).toBe('Sam made something for Maya');
    expect(teaser.description).toBe('A little surprise is waiting inside. Tap to open it.');
    expect(teaser.line).toBe('Sam made you something');
  });

  it('puts the greeting in capitals above the name, without its trailing comma', () => {
    expect(teaserFor(base).eyebrow).toBe('HAPPY BIRTHDAY');
    expect(teaserFor({ ...base, greeting: 'For you,' }).eyebrow).toBe('FOR YOU');
  });

  it('says "someone" when the sender is not known', () => {
    const noSender = teaserFor({ ...base, fromName: null });
    expect(noSender.title).toBe('Someone made something for Maya');
    expect(noSender.line).toBe('Someone made you something');
    expect(teaserFor({ ...base, fromName: '   ' }).line).toBe('Someone made you something');
  });

  it('keeps a very long name or sender from running off the image', () => {
    const teaser = teaserFor({ ...base, recipientName: 'A'.repeat(60), fromName: 'B'.repeat(60) });
    expect(teaser.headline.length).toBeLessThanOrEqual(22);
    expect(teaser.line.length).toBeLessThanOrEqual('B'.repeat(26).length + ' made you something'.length);
    expect(teaser.headline.endsWith('…')).toBe(true);
  });

  it('never carries the message or anything the sender wrote beyond their name', () => {
    const teaser = teaserFor({ ...base });
    const everything = Object.values(teaser).join(' ').toLowerCase();
    expect(everything).not.toMatch(/message|photo/);
  });
});

describe('teaserFor a locked card', () => {
  it('reveals nothing personal: no name, no sender', () => {
    const teaser = teaserFor({ kind: 'locked' });
    expect(teaser.title).toBe('A surprise is waiting for you');
    expect(teaser.headline).toBe('For you');
    expect(Object.values(teaser).join(' ')).not.toMatch(/Maya|Sam/);
    expect(teaser.cta).toMatch(/code/i);
  });
});

describe('headlineSize', () => {
  it('shrinks as a one-line name gets longer, and never goes below a readable size', () => {
    const oneLine = ['Ana', 'Maya', 'Maya Rao', 'Maximilia'].map((n) => headlineSize(n));
    expect(oneLine).toEqual([...oneLine].sort((a, b) => b - a));
    expect(headlineSize('x'.repeat(22))).toBeGreaterThanOrEqual(64);
  });

  it('gives a long name a second line rather than shrinking it to nothing', () => {
    // Ten letters wrap onto two lines, so the type can be larger than a nine-letter name on one.
    expect(headlineSize('Maximilian')).toBeGreaterThan(headlineSize('Maximilia'));
  });

  it('sizes by width, not letter count: a short phrase with wide letters still fits one line', () => {
    // "For you" is seven characters but is as wide as a nine-letter name.
    const size = headlineSize('For you');
    expect(size).toBeLessThan(headlineSize('Maya'));
    expect(7 * 0.58 * size).toBeLessThanOrEqual(560);
  });

  it('keeps a long name inside the room on two lines', () => {
    const name = 'Maximilian Alexan…';
    const size = headlineSize(name);
    expect(Math.ceil(name.length / 2) * 0.58 * size).toBeLessThanOrEqual(560);
  });
});

describe('truncate', () => {
  it('leaves short text alone, tidies spaces, and cuts long text with an ellipsis', () => {
    expect(truncate('  Maya   Rao ', 20)).toBe('Maya Rao');
    expect(truncate('abcdefghij', 6)).toBe('abcde…');
  });
});
