'use client';

import Link from 'next/link';
import type { CSSProperties } from 'react';
import { trackCardEvent } from '@/lib/cardEvents';
import { mapsUrl } from '@/lib/invitation';
import { GuestPass } from '../GuestPass';
import { MomentStack } from '../MomentStack';
import { Divider, MapArt } from '../ornaments';
import { useScene } from '../scroll';
import styles from '../invitation.module.css';
import type { SceneContext } from './context';

/** Where it is, with an illustrated map and a button to the real one. */
export function VenueBlock({ ctx, variant }: { ctx: SceneContext; variant?: string }) {
  const { invitation } = ctx;
  const map = useScene<HTMLDivElement>('pass');
  return (
    <section className={`${styles.section} ${styles.venue}`} aria-labelledby="venue-title" data-variant={variant}>
      <Divider className={styles.divider} />
      <h2 className={styles.heading} id="venue-title" data-reveal="up">
        Venue
      </h2>
      <div ref={map} className={styles.mapCard} data-reveal="zoom">
        <MapArt className={styles.map} />
      </div>
      <p className={styles.venueName} data-reveal="up">
        {invitation.venueName}
      </p>
      {invitation.venueAddress ? (
        <p className={styles.venueAddress} data-reveal="up" style={{ '--i': 1 } as CSSProperties}>
          {invitation.venueAddress}
        </p>
      ) : null}
      <div className={styles.actions} data-reveal="up" style={{ '--i': 2 } as CSSProperties}>
        <a className={styles.ghost} href={mapsUrl(invitation)} target="_blank" rel="noopener noreferrer">
          Open in Maps
        </a>
      </div>
    </section>
  );
}

/** The photos as a stack to swipe, and the host's note. */
export function MomentsBlock({ ctx, variant }: { ctx: SceneContext; variant?: string }) {
  return (
    <div className={styles.wrap} data-variant={variant}>
      <MomentStack photos={ctx.stackPhotos} />
      {ctx.card.message ? (
        <section className={`${styles.section} ${styles.noteSection}`}>
          <p className={styles.note} data-reveal="up">
            {ctx.card.message}
          </p>
        </section>
      ) : null}
    </div>
  );
}

/** The reply pass, or a plain line when there is no number to reply to. */
export function ReplyBlock({ ctx }: { ctx: SceneContext }) {
  if (!ctx.hasReply) {
    return (
      <section className={styles.rsvp} id="rsvp">
        <p className={styles.noRsvp}>Please let the family know you are coming.</p>
      </section>
    );
  }
  return <GuestPass invitation={ctx.invitation} collected={ctx.lit.size} total={ctx.entries.length} onSend={ctx.sendReply} />;
}

export function FooterBlock({ ctx }: { ctx: SceneContext }) {
  return (
    <footer className={styles.footer}>
      <div className={styles.wrap}>
        <p className={styles.thanks} data-reveal="up">
          We cannot wait to celebrate with you
        </p>
        <Link
          href={`/?ref=${encodeURIComponent(ctx.slug)}`}
          className={styles.makeOne}
          onClick={() => trackCardEvent(ctx.slug, 'cta', ctx.card.isDemo)}
        >
          Planning a celebration? Make an invitation like this
        </Link>
        <p className={styles.brand}>Occasio</p>
      </div>
    </footer>
  );
}
