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

export function storyFramePath({ occasion, found, of }: StoryFrameParams): string {
  const query = new URLSearchParams({ occasion, found: String(found), of: String(of) });
  return `/api/story-frame?${query.toString()}`;
}

export type StoryFrameCopy = {
  eyebrow: string;
  headline: string;
  /** Under the headline, or null when there are no stars to report. */
  score: string | null;
  /** The button-looking line the person lays their link sticker over. */
  cta: string;
};

const HEADLINES: Record<StoryOccasion, string> = {
  birthday: 'Someone made me a birthday wish',
  anniversary: 'Someone made me an anniversary card',
  thank_you: 'Someone made me a thank-you card',
  congratulations: 'Someone made me a little celebration',
  just_because: 'Someone made me something, just because',
};

/** Font size for the headline on the picture: smaller for the longer ones, so none runs past two lines. */
export function storyHeadlineSize(headline: string): number {
  return headline.length > 30 ? 76 : 88;
}

export function storyScoreLine(found: number, of: number): string | null {
  if (of <= 0 || found <= 0) return null;
  return found >= of ? 'Every star found' : `${found} of ${of} stars found`;
}

export function storyFrameCopy({ occasion, found, of }: StoryFrameParams): StoryFrameCopy {
  return {
    eyebrow: 'I GOT A SURPRISE',
    headline: HEADLINES[occasion],
    score: storyScoreLine(found, of),
    cta: 'Make one for someone',
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
