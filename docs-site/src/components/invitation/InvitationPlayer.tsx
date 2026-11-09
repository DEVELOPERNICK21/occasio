'use client';

import { useEffect, useMemo, useRef, type ComponentType, type CSSProperties } from 'react';
import { ReportCardLink } from '@/components/ReportCardLink';
import type { Invitation } from '@/lib/invitation';
import { themeFor, themeVars, type Look } from '@/lib/invitationTheme';
import type { RecipientCard } from '@/lib/recipientCard';
import { BurstLayer } from './bursts';
import { registerPage, useReveal } from './scroll';
import { BaraatScene } from './scenes/baraat/BaraatScene';
import { GardenScene } from './scenes/garden/GardenScene';
import { PalaceScene } from './scenes/palace/PalaceScene';
import { PartyScene } from './scenes/PartyScene';
import type { SceneContext } from './scenes/context';
import { useInvitationState } from './scenes/useInvitationState';
import { ThemeContext } from './theme';
import styles from './invitation.module.css';

type Props = { card: RecipientCard & { invitation: Invitation }; slug: string };

/** Which scene tells each look's story. Each owns its entrance, its art and the order of its page. */
const SCENES: Record<Look, ComponentType<{ ctx: SceneContext }>> = {
  party: PartyScene,
  regal: BaraatScene,
  sage: GardenScene,
  palace: PalaceScene,
};

/**
 * An invitation as an experience rather than a page. The player owns what every look shares: the
 * theme, the game state, the confetti and the report link. The scene it picks (`SCENES`) is the
 * story: the entrance you open yourself and everything that happens as you scroll.
 *
 * One link for every guest; nothing a guest does is stored. The reply is a WhatsApp message.
 */
export function InvitationPlayer({ card, slug }: Props) {
  const invitation = card.invitation;
  const theme = useMemo(
    () => themeFor(invitation.occasion, invitation.design),
    [invitation.occasion, invitation.design],
  );
  const { context, bursts, glow } = useInvitationState(card, slug, theme);
  const root = useRef<HTMLDivElement>(null);

  useReveal(root);
  useEffect(() => {
    const element = root.current;
    return element ? registerPage(element) : undefined;
  }, []);

  const Scene = SCENES[theme.look];

  return (
    <ThemeContext.Provider value={theme}>
      <div
        ref={root}
        className={styles.root}
        data-family={theme.family}
        data-look={theme.look}
        data-opened={context.opened ? '' : undefined}
        style={themeVars(theme.palette) as CSSProperties}
      >
        <Scene ctx={context} />
        {glow > 0 ? <div key={glow} className={styles.glow} aria-hidden /> : null}
        <BurstLayer bursts={bursts} />
        <ReportCardLink slug={slug} />
      </div>
    </ThemeContext.Provider>
  );
}
