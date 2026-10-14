'use client';

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { trackCardEvent } from '@/lib/cardEvents';
import {
  storyFramePath,
  storyLandingUrl,
  storyOccasionFor,
  storyShareCaption,
} from '@/lib/experience/storyShare';
import { shareStoryFrame } from '@/lib/experience/storyShareFlow';

type Props = {
  slug: string;
  templateType: string;
  /** Stars found, and how many there were to find. */
  found: number;
  of: number;
  isDemo?: boolean;
};

type Status = 'idle' | 'working' | 'done' | 'error';
type Frame = { file: File; url: string };

const FILE_NAME = 'occasio-story.png';

async function loadFrame(path: string, signal?: AbortSignal): Promise<File | null> {
  try {
    const response = await fetch(path, { signal });
    if (!response.ok) return null;
    return new File([await response.blob()], FILE_NAME, { type: 'image/png' });
  } catch {
    return null;
  }
}

function saveFile(file: File): void {
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/**
 * "Share to your story". A sheet shows the picture first, so the person sees exactly what will
 * go public, with one switch for the peek at the card (who made it, the opening of the message, a
 * blurred photo). Switched off, the picture says only that they got a surprise. The picture is
 * fetched ahead of the tap so the share sheet can open straight from it, which some browsers
 * insist on.
 */
export function StoryShareButton({ slug, templateType, found, of, isDemo = false }: Props) {
  const occasion = storyOccasionFor(templateType);
  const [open, setOpen] = useState(false);
  const [peek, setPeek] = useState(true);
  const [frame, setFrame] = useState<Frame | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<Status>('idle');
  const [copied, setCopied] = useState(false);
  const path = storyFramePath({ occasion, found, of }, peek ? slug : null);

  useEffect(() => {
    const controller = new AbortController();
    let objectUrl: string | null = null;
    let current = true;
    setLoading(true);
    setFrame(null);
    void loadFrame(path, controller.signal).then((file) => {
      if (!current) return;
      setLoading(false);
      if (!file) return;
      objectUrl = URL.createObjectURL(file);
      setFrame({ file, url: objectUrl });
    });
    return () => {
      current = false;
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [path]);

  const close = useCallback(() => {
    setOpen(false);
    setStatus('idle');
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [open, close]);

  const share = useCallback(async () => {
    if (!frame) return;
    setStatus('working');
    const caption = storyShareCaption(occasion, storyLandingUrl(window.location.origin, slug));
    const nav = navigator as Navigator & { canShare?: (data: { files: File[] }) => boolean };
    const outcome = await shareStoryFrame(frame.file, caption, {
      canShare: nav.canShare ? (data) => nav.canShare!(data) : undefined,
      share: nav.share ? (data) => nav.share(data) : undefined,
      save: saveFile,
      copy: navigator.clipboard ? (text) => navigator.clipboard.writeText(text) : undefined,
    });
    if (outcome.kind === 'cancelled') {
      setStatus('idle');
      return;
    }
    setCopied(outcome.captionCopied);
    setStatus('done');
    trackCardEvent(slug, 'story_share', isDemo);
  }, [frame, isDemo, occasion, slug]);

  return (
    <>
      <button type="button" className="landing-btn-secondary" onClick={() => setOpen(true)}>
        Share to your story
      </button>
      {open && typeof document !== 'undefined'
        ? createPortal(
            <div className="storysheet" onClick={close}>
              <div
                className="storysheet__panel"
                role="dialog"
                aria-modal="true"
                aria-labelledby="storysheet-title"
                onClick={(event) => event.stopPropagation()}
              >
                <h2 id="storysheet-title" className="storysheet__title">
                  Share to your story
                </h2>
                <div className="storysheet__preview" aria-busy={loading}>
                  {frame ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={frame.url} alt="The picture you will share" />
                  ) : (
                    <span>{loading ? 'Making your picture…' : 'Could not make the picture.'}</span>
                  )}
                </div>
                <label className="storysheet__toggle">
                  <input type="checkbox" checked={peek} onChange={(event) => setPeek(event.target.checked)} />
                  <span>Show a peek of what they wrote</span>
                </label>
                <p className="storysheet__note">
                  {peek
                    ? 'Shows who made it, the opening of the message and a blurred photo. Nothing else.'
                    : 'Shows only that you got a surprise.'}
                </p>
                <button
                  type="button"
                  className="landing-btn-primary"
                  onClick={() => void share()}
                  disabled={!frame || status === 'working'}
                >
                  {status === 'working' ? 'Opening…' : 'Share'}
                </button>
                <button type="button" className="landing-btn-secondary" onClick={close}>
                  Not now
                </button>
                {status === 'done' ? (
                  <p className="storysheet__note" role="status">
                    {copied
                      ? 'Add a link sticker over the button when you post. Your caption is copied.'
                      : 'Add a link sticker over the button when you post.'}
                  </p>
                ) : null}
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
