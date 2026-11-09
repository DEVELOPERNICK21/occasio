import { allowCardRead, recordCardMiss } from '@/lib/cardReadLimit';
import { fetchRecipientCard } from '@/lib/fetchRecipientCard';
import { invitationIcs } from '@/lib/invitation';
import { clientIp } from '@/lib/rateLimit';

export const runtime = 'nodejs';

type RouteContext = { params: Promise<{ slug: string }> };

const NOT_FOUND = { status: 404, headers: { 'Cache-Control': 'no-store' } } as const;

/**
 * GET /api/v1/cards/:slug/calendar: every event of an invitation as an `.ics` file.
 * A plain link, because phones offer "Add to calendar" for one and handle a downloaded blob badly.
 */
export async function GET(request: Request, context: RouteContext) {
  const { slug } = await context.params;
  if (!slug || slug.length < 6 || slug.length > 32) {
    return new Response('Not found', NOT_FOUND);
  }

  const ip = clientIp(request);
  if (!allowCardRead(ip)) {
    return new Response('Too many requests. Try again shortly.', { status: 429 });
  }

  const result = await fetchRecipientCard(slug);
  if (result.kind !== 'card' || !result.card.invitation) {
    if (result.kind === 'missing') recordCardMiss(ip);
    return new Response('Not found', NOT_FOUND);
  }

  return new Response(invitationIcs(result.card.invitation, slug), {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'inline; filename="invitation.ics"',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex',
    },
  });
}
