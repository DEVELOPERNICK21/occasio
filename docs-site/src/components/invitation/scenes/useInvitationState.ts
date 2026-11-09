'use client';

import { useCallback, useMemo, useState, type MouseEvent } from 'react';
import { trackCardEvent } from '@/lib/cardEvents';
import {
  calendarEntries,
  hostLineOf,
  invitationInitials,
  invitationTitle,
  type Invitation,
} from '@/lib/invitation';
import type { InvitationTheme } from '@/lib/invitationTheme';
import type { RecipientCard } from '@/lib/recipientCard';
import { useBursts } from '../bursts';
import { haptic, prefersReducedMotion } from '../scroll';
import type { SceneContext } from './context';

/** The state every scene shares: the entrance, the collected events and the effects. */
export function useInvitationState(
  card: RecipientCard & { invitation: Invitation },
  slug: string,
  theme: InvitationTheme,
) {
  const invitation = card.invitation;
  const { bursts, fire, fireFrom } = useBursts(theme.palette.confetti);
  const [opened, setOpened] = useState(false);
  const [gateGone, setGateGone] = useState(false);
  const [lit, setLit] = useState<ReadonlySet<number>>(new Set());
  const [glow, setGlow] = useState(0);

  const entries = useMemo(() => calendarEntries(invitation), [invitation]);
  const total = entries.length;
  const photos = useMemo(() => (card.mediaUrls ?? []).filter(Boolean), [card.mediaUrls]);
  // The stack starts on the second photo and ends on the first, so the portrait is the last surprise.
  const stackPhotos = useMemo(
    () => (photos.length > 1 ? [...photos.slice(1), photos[0]!] : []),
    [photos],
  );

  const open = useCallback(() => {
    setOpened(true);
    trackCardEvent(slug, 'opened', card.isDemo);
  }, [card.isDemo, slug]);
  const gone = useCallback(() => setGateGone(true), []);
  const flash = useCallback(() => setGlow((count) => count + 1), []);

  const toggleToken = useCallback(
    (index: number, element: HTMLElement) => {
      const turningOn = !lit.has(index);
      setLit((current) => {
        const next = new Set(current);
        if (next.has(index)) next.delete(index);
        else next.add(index);
        return next;
      });
      if (!turningOn) return;
      fireFrom(element, 'sparks');
      haptic(10);
      if (lit.size + 1 === total) {
        // Everything is collected: a toss of petals or confetti and a warm wash across the page.
        fireFrom(element, theme.family === 'regal' ? 'petals' : 'confetti', 1.5);
        setGlow((count) => count + 1);
      }
    },
    [fireFrom, lit, theme.family, total],
  );

  const sendReply = useCallback(
    (pass: HTMLElement | null, answer: 'yes' | 'no') => {
      if (!pass) return;
      // The stamp lands a moment after the click; the confetti follows it.
      window.setTimeout(() => {
        const rect = pass.getBoundingClientRect();
        if (answer === 'yes') {
          fire(rect.left + rect.width / 2, rect.top + Math.min(rect.height * 0.3, 220), 'confetti', 1.4);
        }
      }, 380);
    },
    [fire],
  );

  const goToReply = useCallback((event: MouseEvent<HTMLAnchorElement>) => {
    const target = document.getElementById('rsvp');
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
  }, []);

  const context: SceneContext = {
    card,
    slug,
    invitation,
    theme,
    title: invitationTitle(invitation),
    initials: invitationInitials(invitation),
    hostLine: hostLineOf(invitation),
    photos,
    stackPhotos,
    entries,
    hasReply: Boolean(invitation.rsvpWhatsapp),
    opened,
    gateGone,
    open,
    gone,
    lit,
    toggleToken,
    fire,
    fireFrom,
    sendReply,
    goToReply,
    flash,
  };

  return { context, bursts, glow };
}
