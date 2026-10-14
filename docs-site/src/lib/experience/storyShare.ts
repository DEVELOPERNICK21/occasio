/**
 * The "share to your story" frame a recipient can post after opening a card: a 9:16 picture
 * of Pip with the occasion and how many stars they found, plus a caption.
 *
 * It is made to be public, so it carries nothing from the card: no photo, no message, no
 * names. Only the occasion and a score, which is why the picture needs no card lookup and can
 * be cached for good. The link in the caption goes to the public landing page, never to the
 * private card.
 */
import { isMomentId, type MomentId } from './momentTheme';

export type StoryOccasion = MomentId;

export const MAX_STORY_STARS = 12;

export type StoryFrameParams = {
  occasion: StoryOccasion;
  /** Stars found. */
  found: number;
  /** Stars there were to find. 0 when the card has none. */
  of: number;
};

/** Any card type that is not one of the five moments (sorry, proposal...) looks like a birthday. */
export function storyOccasionFor(templateType: string): StoryOccasion {
  return isMomentId(templateType) ? templateType : 'birthday';
}

function whole(value: string | null, max: number): number {
  const n = Number.parseInt(value ?? '', 10);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(n, max);
}

/** Reads the picture's inputs from a URL. Anything unknown or out of range is made safe, never refused. */
export function parseStoryFrameParams(search: URLSearchParams): StoryFrameParams {
  const occasion = storyOccasionFor(search.get('occasion') ?? '');
  const of = whole(search.get('of'), MAX_STORY_STARS);
  const found = Math.min(whole(search.get('found'), MAX_STORY_STARS), of);
  return { occasion, found, of };
}

/**
 * Bump this whenever the picture's design changes. The plain picture is cached for good, so a
 * new design needs a new address or browsers and the CDN keep showing the old one.
 */
export const STORY_FRAME_VERSION = 2;

/**
 * The picture's address. With a `slug` the picture also gives a peek at that card (who made it,
 * the opening of the message, a blurred photo); without one it is the plain frame.
 */
export function storyFramePath({ occasion, found, of }: StoryFrameParams, slug: string | null = null): string {
  const query = new URLSearchParams({
    occasion,
    found: String(found),
    of: String(of),
    v: String(STORY_FRAME_VERSION),
  });
  if (slug) query.set('slug', slug);
  return `/api/story-frame?${query.toString()}`;
}

/** What the card holds, as much of it as the person chooses to show. Null means show nothing of it. */
export type StoryGlimpse = {
  /** Who made it, first name only. */
  fromFirstName: string | null;
  /** The opening of the message, cut at a word; null when there is none or it looks private. */
  excerpt: string | null;
  photos: number;
  reasons: number;
};

const FIRST_NAME_MAX = 18;
const EXCERPT_MAX = 72;
/** Links, email addresses and long numbers do not belong in a picture that goes public. */
const LOOKS_PRIVATE = /https?:\/\/|www\.|@|\d{6,}/i;

export function firstNameOf(name: string | null | undefined): string | null {
  const first = (name ?? '').trim().split(/\s+/)[0] ?? '';
  const clean = Array.from(first).slice(0, FIRST_NAME_MAX).join('');
  return clean || null;
}

/**
 * The first words of a message, for the peek. A longer message is cut at a word and ends in an
 * ellipsis, so there is clearly more to read. Counted in characters, not code units, so an
 * emoji is never split.
 */
export function excerptOf(message: string | null | undefined, max = EXCERPT_MAX): string | null {
  const text = (message ?? '').replace(/\s+/g, ' ').trim();
  if (!text) return null;
  const chars = Array.from(text);
  let shown = text;
  if (chars.length > max) {
    const head = chars.slice(0, max).join('');
    const space = head.lastIndexOf(' ');
    shown = `${(space > max * 0.5 ? head.slice(0, space) : head).replace(/[\s,;:\-\u2013\u2014]+$/u, '')}\u2026`;
  }
  return LOOKS_PRIVATE.test(shown) ? null : shown;
}

type GlimpseSource = {
  message?: string | null;
  fromName?: string | null;
  mediaUrls?: readonly string[] | null;
  reasons?: readonly string[] | null;
};

export function storyGlimpse(card: GlimpseSource): StoryGlimpse {
  return {
    fromFirstName: firstNameOf(card.fromName),
    excerpt: excerptOf(card.message),
    photos: card.mediaUrls?.filter((url) => url.trim()).length ?? 0,
    reasons: card.reasons?.filter((reason) => reason.trim()).length ?? 0,
  };
}

export type StoryFrameCopy = {
  eyebrow: string;
  headline: string;
  /** Under the headline, or null when there are no stars to report. */
  score: string | null;
  /** The button-looking line the person lays their link sticker over. */
  cta: string;
  /** The opening of the message, or null. */
  excerpt: string | null;
  /** The signature on the little card, or null. */
  signature: string | null;
  /** What is inside, as short chips: photos, reasons, stars. */
  chips: string[];
};

const HEADLINES: Record<StoryOccasion, string> = {
  birthday: 'Someone made me a birthday wish',
  anniversary: 'Someone made me an anniversary card',
  thank_you: 'Someone made me a thank-you card',
  congratulations: 'Someone made me a little celebration',
  just_because: 'Someone made me something, just because',
};

const NAMED_HEADLINES: Record<StoryOccasion, (name: string) => string> = {
  birthday: (name) => `${name} made me a birthday surprise`,
  anniversary: (name) => `${name} made me an anniversary surprise`,
  thank_you: (name) => `${name} made me a thank-you`,
  congratulations: (name) => `${name} made me a celebration`,
  just_because: (name) => `${name} made me something, just because`,
};

/** Font size for the headline on the picture: smaller for the longer ones, so none runs past two lines. */
export function storyHeadlineSize(headline: string): number {
  if (headline.length > 42) return 66;
  return headline.length > 30 ? 76 : 88;
}

export function storyScoreLine(found: number, of: number): string | null {
  if (of <= 0 || found <= 0) return null;
  return found >= of ? 'Every star found' : `${found} of ${of} stars found`;
}

/** The short chips for what is inside: photos, reasons, stars. Three at most, so they stay on one line. */
export function storyChips(glimpse: StoryGlimpse | null, found: number, of: number): string[] {
  const chips: string[] = [];
  if (glimpse && glimpse.photos > 0) chips.push(glimpse.photos === 1 ? '1 photo' : `${glimpse.photos} photos`);
  if (glimpse && glimpse.reasons > 0) chips.push(glimpse.reasons === 1 ? '1 reason' : `${glimpse.reasons} reasons`);
  const score = storyScoreLine(found, of);
  if (score) chips.push(score);
  return chips;
}

export function storyFrameCopy(
  { occasion, found, of }: StoryFrameParams,
  glimpse: StoryGlimpse | null = null,
): StoryFrameCopy {
  const name = glimpse?.fromFirstName ?? null;
  return {
    eyebrow: 'I GOT A SURPRISE',
    headline: name ? NAMED_HEADLINES[occasion](name) : HEADLINES[occasion],
    score: storyScoreLine(found, of),
    cta: 'Make one for someone',
    excerpt: glimpse?.excerpt ?? null,
    signature: name ? `With love, ${name}` : null,
    chips: storyChips(glimpse, found, of),
  };
}

const CAPTIONS: Record<StoryOccasion, string> = {
  birthday: 'Someone made me a birthday surprise. See if you can find every star.',
  anniversary: 'An anniversary surprise, made just for me.',
  thank_you: 'A thank-you I did not see coming.',
  congratulations: 'Someone made a little celebration for me.',
  just_because: 'Someone made me something, just because.',
};

/** Ready to paste under the story. Calm, no hype, and one link: the public page. */
export function storyShareCaption(occasion: StoryOccasion, landingUrl: string): string {
  return `${CAPTIONS[occasion]} Make one for your person: ${landingUrl}`;
}

/** The public landing page, tagged with the card it came from so we can count the people it brings. */
export function storyLandingUrl(base: string, slug: string): string {
  return `${base.replace(/\/$/, '')}/?ref=${encodeURIComponent(slug)}`;
}
