'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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
 * "Share to your story": the picture of Pip and the star score, ready for Instagram or WhatsApp
 * Status. Nothing from the card is in it. The picture is fetched ahead of the tap so the share
 * sheet can open straight from it, which some browsers insist on.
 */
export function StoryShareButton({ slug, templateType, found, of, isDemo = false }: Props) {
  const occasion = storyOccasionFor(templateType);
  const path = storyFramePath({ occasion, found, of });
  const ready = useRef<File | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    ready.current = null;
    const controller = new AbortController();
    void loadFrame(path, controller.signal).then((file) => {
      ready.current = file;
    });
    return () => controller.abort();
  }, [path]);

  const share = useCallback(async () => {
    setStatus('working');
    const file = ready.current ?? (await loadFrame(path));
    if (!file) {
      setStatus('error');
      return;
    }
    const caption = storyShareCaption(occasion, storyLandingUrl(window.location.origin, slug));
    const nav = navigator as Navigator & { canShare?: (data: { files: File[] }) => boolean };
    const outcome = await shareStoryFrame(file, caption, {
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
  }, [isDemo, occasion, path, slug]);

  return (
    <>
      <button
        type="button"
        className="landing-btn-secondary"
        onClick={() => void share()}
        disabled={status === 'working'}
      >
        {status === 'working' ? 'Making your picture…' : 'Share to your story'}
      </button>
      {status === 'done' ? (
        <p className="finale__hint" role="status">
          {copied
            ? 'Add a link sticker over the button when you post. Your caption is copied.'
            : 'Add a link sticker over the button when you post.'}
        </p>
      ) : null}
      {status === 'error' ? (
        <p className="finale__hint" role="status">
          Could not make the picture. Check your connection and try again.
        </p>
      ) : null}
    </>
  );
}
