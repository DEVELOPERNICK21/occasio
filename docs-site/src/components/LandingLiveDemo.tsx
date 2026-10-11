'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { OccasionIcon } from '@/components/OccasionIcon';
import { Pip } from '@/components/story/fx/Pip';
import { momentThemeFor } from '@/lib/experience/momentTheme';
import {
  LANDING_MOMENTS,
  sampleWishPath,
  type LandingMomentId,
} from '@/lib/landingMoments';

/** The sample is built for a normal phone screen; it is drawn at this size and scaled to fit. */
const SAMPLE_WIDTH = 375;
const SAMPLE_HEIGHT = 812;
const DEFAULT_SCALE = 0.7;

/**
 * The hero phone: a real, playable sample of what the person you send a wish
 * to receives. Nothing loads until someone taps play (so the page stays light
 * and the phone never traps a scroll), and the tap also lets the sample play
 * its sound.
 */
export function LandingLiveDemo() {
  const [moment, setMoment] = useState<LandingMomentId>('birthday');
  const [playing, setPlaying] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [round, setRound] = useState(0);
  const [scale, setScale] = useState(DEFAULT_SCALE);
  const screen = useRef<HTMLDivElement>(null);
  const theme = momentThemeFor(moment);

  useEffect(() => {
    const el = screen.current;
    if (!el) return undefined;
    const measure = () => setScale(el.clientWidth / SAMPLE_WIDTH || DEFAULT_SCALE);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const pick = useCallback((next: LandingMomentId) => {
    setMoment(next);
    setLoaded(false);
    setRound((n) => n + 1);
    setPlaying(true);
  }, []);

  const replay = useCallback(() => {
    setLoaded(false);
    setRound((n) => n + 1);
  }, []);

  return (
    <div id="try" className="landing-live">
      <div className="landing-phone landing-phone--hero landing-phone--live">
        <div className="landing-phone-side landing-phone-side--left" aria-hidden />
        <div className="landing-phone-side landing-phone-side--right" aria-hidden />
        <div ref={screen} className="landing-phone-screen landing-live__screen">
          {playing ? (
            <iframe
              key={`${moment}-${round}`}
              src={sampleWishPath(moment)}
              title={`Sample ${theme.label.toLowerCase()} wish`}
              className="landing-live__frame"
              style={{
                width: SAMPLE_WIDTH,
                height: SAMPLE_HEIGHT,
                transform: `scale(${scale})`,
              }}
              allow="autoplay"
              onLoad={() => setLoaded(true)}
            />
          ) : null}

          {!playing || !loaded ? (
            <div
              className="landing-live__poster"
              style={{ background: theme.vars['--bg'] }}
              aria-hidden={playing}
            >
              <p className="landing-live__ticket">A surprise for Maya</p>
              <Pip mood="hopeful" theme={theme} size={176} holdsGift />
              {playing ? (
                <p className="landing-live__loading">Opening…</p>
              ) : (
                <button
                  type="button"
                  className="landing-live__play"
                  onClick={() => setPlaying(true)}
                >
                  <span className="landing-live__play-icon" aria-hidden>
                    <svg viewBox="0 0 24 24" width="14" height="14">
                      <path d="M8 5v14l11-7z" fill="currentColor" />
                    </svg>
                  </span>
                  Play a sample
                </button>
              )}
            </div>
          ) : null}
        </div>
      </div>

      <div className="landing-live__controls">
        <p className="landing-live__hint">
          {playing
            ? 'This is a real sample. Tap through it, sound on.'
            : 'See what they receive when they open your link.'}
        </p>
        <ul className="landing-live__chips" aria-label="Choose a moment to play">
          {LANDING_MOMENTS.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className="landing-live__chip"
                aria-pressed={moment === item.id}
                onClick={() => pick(item.id)}
              >
                <OccasionIcon templateType={item.id} className="h-4 w-4" />
                {item.label}
              </button>
            </li>
          ))}
        </ul>
        {playing ? (
          <button type="button" className="landing-live__replay" onClick={replay}>
            Start this sample again
          </button>
        ) : null}
      </div>
    </div>
  );
}
