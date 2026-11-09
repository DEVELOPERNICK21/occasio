import type { CSSProperties, ReactNode } from 'react';
import { themeFor } from '../invitationTheme';
import type { Invitation, InvitationDesign } from '../invitation';
import { FLOWERS, marigold } from './invitationImage';
import { heavy } from './surpriseImage';
import type { Teaser } from './teaser';

type Props = {
  teaser: Teaser;
  invitation: Pick<Invitation, 'occasion' | 'nameOne' | 'nameTwo'> & { design: InvitationDesign };
  /** The design's own photograph, cut to fit (see `designPhotoDataUrl`). */
  photo: string;
};

const fill: CSSProperties = { position: 'absolute', left: 0, top: 0, width: 1200, height: 630, display: 'flex' };

/** The names, one line for a couple with short names and two lines when they are long. */
function Names({ names, room, color, amp }: { names: string[]; room: number; color: string; amp: string }) {
  const letters = names.reduce((total, name) => total + Array.from(name).length, 0);
  const stacked = names.length > 1 && letters > 13;
  const longest = Math.max(...names.map((name) => Array.from(name).length));
  const size = stacked
    ? Math.max(54, Math.min(100, Math.floor(room / (longest * 0.58))))
    : Math.max(54, Math.min(116, Math.floor(room / (letters * 0.58 + (names.length > 1 ? 2.4 : 0)))));
  const ampersand: ReactNode = names[1] ? (
    <span style={{ display: 'flex', margin: stacked ? '2px 0' : '0 26px', fontSize: size * 0.6, color: amp, ...heavy(amp, 2) }}>
      &amp;
    </span>
  ) : null;
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: stacked ? 'column' : 'row',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size,
        lineHeight: 1.04,
        color,
        ...heavy(color, 2.6),
      }}
    >
      <span style={{ display: 'flex' }}>{names[0]}</span>
      {ampersand}
      {names[1] ? <span style={{ display: 'flex' }}>{names[1]}</span> : null}
    </div>
  );
}

function Pill({ children, background, color }: { children: ReactNode; background: string; color: string }) {
  return (
    <div
      style={{
        display: 'flex',
        padding: '16px 42px',
        borderRadius: 999,
        background,
        color,
        fontSize: 29,
        ...heavy(color, 0.6),
      }}
    >
      {children}
    </div>
  );
}

/**
 * The link preview of a wedding, engagement or anniversary invitation, with the design's own
 * photograph: the palace gate in an arch, the garden under a card of names, the wedding car as a print.
 * A photograph the host uploaded never appears; the pictures here are the ones the page ships with.
 */
export function InvitationPhotoImage({ teaser, invitation, photo }: Props) {
  const { palette } = themeFor(invitation.occasion, invitation.design);
  const names = invitation.nameTwo ? [invitation.nameOne, invitation.nameTwo] : [invitation.nameOne];

  if (invitation.design === 'sage') {
    return (
      <div style={{ ...fill, background: palette.primaryDeep }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo} width={1200} height={630} alt="" style={{ ...fill, objectFit: 'cover' }} />
        <div
          style={{
            ...fill,
            background: 'linear-gradient(rgba(10, 24, 8, 0.4), rgba(10, 24, 8, 0.08) 48%, rgba(10, 24, 8, 0.5))',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 130,
            top: 96,
            width: 940,
            height: 438,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(253, 250, 236, 0.92)',
            border: `3px solid ${palette.accent}`,
            borderRadius: 46,
            boxShadow: '0 24px 60px rgba(8, 20, 6, 0.45)',
          }}
        >
          <div style={{ display: 'flex', fontSize: 25, letterSpacing: '0.22em', color: palette.primary, ...heavy(palette.primary, 0.6) }}>
            {teaser.eyebrow}
          </div>
          <div style={{ display: 'flex', margin: '16px 0 0' }}>
            <Names names={names} room={800} color={palette.primaryDeep} amp={palette.accent} />
          </div>
          <div style={{ display: 'flex', margin: '20px 0 0', fontSize: 33, color: palette.muted }}>{teaser.line}</div>
          <div style={{ display: 'flex', margin: '28px 0 0' }}>
            <Pill background={palette.primary} color="#ffffff">
              {teaser.cta}
            </Pill>
          </div>
        </div>
      </div>
    );
  }

  const palace = invitation.design === 'palace';
  const ink = palace ? '#fff3dc' : '#6e1d27';
  const gold = palace ? '#e6c377' : palette.accent;

  return (
    <div
      style={{
        ...fill,
        background: palace
          ? 'linear-gradient(135deg, #4d2658 0%, #2b1335 100%)'
          : `linear-gradient(160deg, ${palette.bg} 0%, #f3e5c4 100%)`,
      }}
    >
      {palace ? (
        <div
          style={{
            position: 'absolute',
            left: 64,
            top: 44,
            width: 412,
            height: 586,
            display: 'flex',
            overflow: 'hidden',
            borderRadius: '206px 206px 0 0',
            border: `5px solid ${gold}`,
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.45)',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo} width={402} height={580} alt="" style={{ objectFit: 'cover' }} />
        </div>
      ) : (
        <>
          <svg width="1200" height="110" viewBox="0 0 1200 110" style={{ position: 'absolute', left: 0, top: 10 }}>
            <path
              d={FLOWERS.map((f, i) => `${i === 0 ? 'M' : 'L'}${f.x} ${f.y - 14}`).join(' ')}
              fill="none"
              stroke="#8a6b2f"
              strokeWidth="2"
            />
            {FLOWERS.map((f, i) => marigold(f.x, f.y, i % 2 === 0 ? palette.pop : '#f6b93b', i))}
          </svg>
          <div
            style={{
              position: 'absolute',
              left: 52,
              top: 176,
              display: 'flex',
              padding: 14,
              background: '#ffffff',
              boxShadow: '0 20px 44px rgba(60, 30, 10, 0.38)',
              transform: 'rotate(-2.4deg)',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo} width={500} height={334} alt="" />
          </div>
        </>
      )}

      <div
        style={{
          position: 'absolute',
          left: 540,
          right: 40,
          top: palace ? 0 : 90,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ display: 'flex', fontSize: 25, letterSpacing: '0.22em', color: gold, ...heavy(gold, 0.7) }}>
          {teaser.eyebrow}
        </div>
        <div style={{ display: 'flex', margin: '18px 0 0' }}>
          <Names names={names} room={590} color={ink} amp={palace ? gold : palette.pop} />
        </div>
        <div style={{ display: 'flex', width: 120, height: 3, margin: '22px 0 0', background: gold }} />
        <div style={{ display: 'flex', margin: '20px 0 0', fontSize: 33, color: palace ? '#f1dcae' : palette.muted }}>
          {teaser.line}
        </div>
        <div style={{ display: 'flex', margin: '28px 0 0' }}>
          <Pill background={palace ? gold : palette.primary} color={palace ? '#2b1335' : '#ffffff'}>
            {teaser.cta}
          </Pill>
        </div>
      </div>
    </div>
  );
}
