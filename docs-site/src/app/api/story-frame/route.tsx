import { ImageResponse } from 'next/og';
import { parseStoryFrameParams, storyFrameCopy } from '@/lib/experience/storyShare';
import { ogThemeFor } from '@/lib/og/ogTheme';
import { STORY_SIZE, StoryFrameImage } from '@/lib/og/storyFrameImage';

export const runtime = 'nodejs';

/**
 * GET /api/story-frame?occasion=birthday&found=5&of=6
 *
 * The picture a recipient posts to their story. Public, and it carries nothing from any card:
 * only the occasion and a score, so there is nothing to look up and the same address always
 * gives the same picture. That is why it can be cached for good.
 */
export async function GET(request: Request) {
  const params = parseStoryFrameParams(new URL(request.url).searchParams);
  return new ImageResponse(
    <StoryFrameImage copy={storyFrameCopy(params)} params={params} theme={ogThemeFor(params.occasion)} />,
    {
      ...STORY_SIZE,
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Robots-Tag': 'noindex',
      },
    },
  );
}
