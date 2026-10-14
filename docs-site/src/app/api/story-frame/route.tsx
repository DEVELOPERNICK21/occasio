import { ImageResponse } from 'next/og';
import { fetchRecipientCard } from '@/lib/fetchRecipientCard';
import {
  parseStoryFrameParams,
  storyFrameCopy,
  storyGlimpse,
  storyOccasionFor,
  type StoryGlimpse,
} from '@/lib/experience/storyShare';
import { blurredPhotoDataUrl } from '@/lib/og/blurredPhoto';
import { ogThemeFor } from '@/lib/og/ogTheme';
import { STORY_SIZE, StoryFrameImage } from '@/lib/og/storyFrameImage';

export const runtime = 'nodejs';

const SLUG_LENGTH = { min: 6, max: 32 } as const;

/**
 * GET /api/story-frame?occasion=birthday&found=5&of=6[&slug=abc123]
 *
 * The picture a recipient posts to their story. Without `slug` it is generic and carries nothing
 * from any card, so the same address always gives the same picture and it is cached for good.
 *
 * With `slug` it also gives a peek at that card: who made it, the opening of the message, and
 * the photo only as a blurred wash. The slug is already the secret that opens the card, so this
 * shows nothing the link does not. A locked or missing card gets the generic picture. The
 * app leaves `slug` out when the person chooses to hide the peek.
 */
export async function GET(request: Request) {
  const search = new URL(request.url).searchParams;
  const params = parseStoryFrameParams(search);

  const slug = search.get('slug')?.trim() ?? '';
  const wantsPeek = slug.length >= SLUG_LENGTH.min && slug.length <= SLUG_LENGTH.max;

  let glimpse: StoryGlimpse | null = null;
  let wash: string | null = null;
  let occasion = params.occasion;
  if (wantsPeek) {
    const result = await fetchRecipientCard(slug);
    if (result.kind === 'card') {
      glimpse = storyGlimpse(result.card);
      wash = await blurredPhotoDataUrl(result.card.mediaUrls, { allowDemoFiles: result.card.isDemo });
      occasion = storyOccasionFor(result.card.templateType);
    }
  }

  const framed = { ...params, occasion };
  return new ImageResponse(
    (
      <StoryFrameImage
        copy={storyFrameCopy(framed, glimpse)}
        theme={ogThemeFor(occasion)}
        wash={wash}
        peek={glimpse !== null}
      />
    ),
    {
      ...STORY_SIZE,
      headers: {
        // A card can be edited or revoked, so a peek is only held for a short while.
        'Cache-Control': wantsPeek
          ? 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400'
          : 'public, max-age=31536000, immutable',
        'X-Robots-Tag': 'noindex',
      },
    },
  );
}
