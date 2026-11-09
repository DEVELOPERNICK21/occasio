'use client';

import { useMemo, useState, type CSSProperties } from 'react';
import {
  MAX_RSVP_GUESTS,
  OCCASION_INFO,
  formatDay,
  invitationTitle,
  rsvpLink,
  rsvpMessage,
  type Invitation,
  type RsvpAnswer,
} from '@/lib/invitation';
import { Stamp } from './ornaments';
import { useInvitationTheme } from './theme';
import styles from './invitation.module.css';

type Props = {
  invitation: Invitation;
  /** How many lamps or stars the guest has collected, and how many there are. */
  collected: number;
  total: number;
  /** Called when they send: the player throws confetti from the stamp. */
  onSend: (stamp: HTMLElement | null, answer: RsvpAnswer) => void;
};

/**
 * The RSVP, drawn as a pass to the celebration. The guest's name goes on it, the lamps they lit sit
 * along the bottom, and sending thumps an ink stamp onto it. Nothing is sent to us or stored: the
 * answer becomes a WhatsApp message to the host, written and ready to send, so there is no guest
 * data for us to keep.
 */
export function GuestPass({ invitation, collected, total, onSend }: Props) {
  const { copy, family } = useInvitationTheme();
  const [name, setName] = useState('');
  const [answer, setAnswer] = useState<RsvpAnswer>('yes');
  const [guests, setGuests] = useState(1);
  const [chosen, setChosen] = useState<readonly string[]>(() => invitation.events.map((event) => event.title));
  const [note, setNote] = useState('');
  const [tried, setTried] = useState(false);
  const [sent, setSent] = useState<RsvpAnswer | null>(null);

  const href = useMemo(
    () =>
      rsvpLink(
        invitation,
        rsvpMessage(invitation, {
          name,
          answer,
          guests,
          // Everything ticked is the same as "all of it": no list needed.
          events: chosen.length === invitation.events.length ? [] : chosen,
          note,
        }),
      ),
    [invitation, name, answer, guests, chosen, note],
  );

  /** Any change after sending makes the pass blank again, so it never shows an answer that is out of date. */
  const edit = <T,>(set: (value: T) => void) => (value: T) => {
    setSent(null);
    set(value);
  };

  const toggle = (title: string) => {
    setSent(null);
    setChosen((current) => (current.includes(title) ? current.filter((item) => item !== title) : [...current, title]));
  };

  const missingName = tried && !name.trim();
  const title = invitationTitle(invitation);
  const kind = OCCASION_INFO[invitation.occasion].label;

  return (
    <section className={styles.rsvp} id="rsvp" aria-labelledby="rsvp-title">
      <div className={styles.rsvpIntro} data-reveal="up">
        <h2 className={styles.rsvpTitle} id="rsvp-title">
          Will you join us?
        </h2>
        {invitation.rsvpBy ? <p className={styles.rsvpBy}>Kindly reply by {formatDay(invitation.rsvpBy)}</p> : null}
      </div>

      <div className={styles.pass} data-reveal="up" data-sent={sent ?? undefined} style={{ '--i': 1 } as CSSProperties}>
        <div className={styles.passHead}>
          <span className={styles.passEyebrow}>{copy.passTitle}</span>
          <span className={styles.passTitle}>{title}</span>
          <span className={styles.passDate}>
            {kind} · {formatDay(invitation.date, 'short')}
          </span>
        </div>
        <div className={styles.tear} aria-hidden />

        <div className={styles.passBody}>
          <p className={styles.admit}>
            <span className={styles.admitLabel}>Admit</span>
            <strong className={styles.admitName}>{name.trim() || 'Your name'}</strong>
            {answer === 'yes' && guests > 1 ? <span className={styles.admitMore}>+ {guests - 1}</span> : null}
          </p>

          <label className={styles.field}>
            <span className={styles.label}>Your name</span>
            <input
              className={styles.input}
              value={name}
              onChange={(event) => edit(setName)(event.target.value)}
              autoComplete="name"
              maxLength={40}
              aria-invalid={missingName}
              aria-describedby={missingName ? 'rsvp-name-error' : undefined}
            />
            {missingName ? (
              <span id="rsvp-name-error" className={styles.problem} role="alert">
                Add your name so they know who it is
              </span>
            ) : null}
          </label>

          <div className={styles.choices} role="group" aria-label="Your answer">
            <button
              type="button"
              className={`${styles.choice} ${answer === 'yes' ? styles.choiceOn : ''}`}
              aria-pressed={answer === 'yes'}
              onClick={() => edit(setAnswer)('yes')}
            >
              Joyfully accept
            </button>
            <button
              type="button"
              className={`${styles.choice} ${answer === 'no' ? styles.choiceOn : ''}`}
              aria-pressed={answer === 'no'}
              onClick={() => edit(setAnswer)('no')}
            >
              Sadly decline
            </button>
          </div>

          {answer === 'yes' ? (
            <>
              <div className={styles.field}>
                <span className={styles.label} id="rsvp-guests">
                  How many of you?
                </span>
                <div className={styles.stepper} role="group" aria-labelledby="rsvp-guests">
                  <button
                    type="button"
                    className={styles.step}
                    aria-label="One fewer guest"
                    disabled={guests <= 1}
                    onClick={() => edit(setGuests)(Math.max(1, guests - 1))}
                  >
                    −
                  </button>
                  <span className={styles.count} aria-live="polite">
                    {guests}
                  </span>
                  <button
                    type="button"
                    className={styles.step}
                    aria-label="One more guest"
                    disabled={guests >= MAX_RSVP_GUESTS}
                    onClick={() => edit(setGuests)(Math.min(MAX_RSVP_GUESTS, guests + 1))}
                  >
                    +
                  </button>
                </div>
              </div>

              {invitation.events.length > 1 ? (
                <fieldset className={`${styles.field} ${styles.checks}`}>
                  <legend className={styles.label}>Which celebrations?</legend>
                  {invitation.events.map((event) => (
                    <label key={`${event.title}-${event.date}`} className={styles.check}>
                      <input
                        type="checkbox"
                        checked={chosen.includes(event.title)}
                        onChange={() => toggle(event.title)}
                      />
                      <span className={styles.checkBox} aria-hidden />
                      {event.title}
                    </label>
                  ))}
                </fieldset>
              ) : null}
            </>
          ) : null}

          <label className={styles.field}>
            <span className={styles.label}>A note for the hosts (optional)</span>
            <input
              className={styles.input}
              value={note}
              onChange={(event) => edit(setNote)(event.target.value)}
              maxLength={120}
            />
          </label>

          {total > 0 ? (
            <div className={styles.collected} aria-label={`${collected} of ${total} ${copy.tokens} collected`}>
              <span className={styles.collectedLabel}>
                {collected} of {total} {total === 1 ? copy.token : copy.tokens}
              </span>
              <span className={styles.collectedDots} aria-hidden>
                {Array.from({ length: total }, (_, i) => (
                  <span key={i} className={styles.collectedDot} data-on={i < collected ? '' : undefined} />
                ))}
              </span>
            </div>
          ) : null}

          <a
            className={styles.primary}
            href={href ?? undefined}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(event) => {
              if (!name.trim()) {
                event.preventDefault();
                setTried(true);
                return;
              }
              setSent(answer);
              onSend(event.currentTarget.closest(`.${styles.pass}`), answer);
            }}
          >
            Send my reply on WhatsApp
          </a>
          <p className={styles.fine}>This opens WhatsApp with your reply ready to send. Nothing is saved here.</p>
        </div>

        <div className={styles.stampSlot} aria-hidden>
          <Stamp text={sent === 'no' ? 'WITH REGRET' : family === 'regal' ? 'ACCEPTED WITH JOY' : 'SEE YOU THERE'} className={styles.stamp} />
        </div>
      </div>
    </section>
  );
}
