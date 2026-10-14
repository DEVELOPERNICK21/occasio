/**
 * Hands the story picture to the phone. The share sheet is best (it lists Instagram,
 * WhatsApp Status and the rest); a browser without file sharing gets the picture saved instead.
 * The caption is copied either way, because many apps drop the text that comes with a file.
 *
 * Kept free of the browser so it can be tested: the pieces it needs are passed in.
 */
export type StoryShareDeps = {
  canShare?: (data: { files: File[] }) => boolean;
  share?: (data: { files: File[]; text: string }) => Promise<void>;
  /** Download the picture. */
  save: (file: File) => void;
  /** Copy text to the clipboard. */
  copy?: (text: string) => Promise<void>;
};

export type StoryShareOutcome = {
  kind: 'shared' | 'saved' | 'cancelled';
  /** False when the clipboard was not available, so nothing should claim the caption was copied. */
  captionCopied: boolean;
};

function backedOut(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

export async function shareStoryFrame(
  file: File,
  caption: string,
  deps: StoryShareDeps,
): Promise<StoryShareOutcome> {
  // Started first but not waited for: the share sheet must open straight from the tap, and
  // waiting on the clipboard before it can make some browsers refuse.
  const copying = (async () => {
    try {
      if (!deps.copy) return false;
      await deps.copy(caption);
      return true;
    } catch {
      return false;
    }
  })();

  if (deps.share && deps.canShare?.({ files: [file] })) {
    try {
      await deps.share({ files: [file], text: caption });
      return { kind: 'shared', captionCopied: await copying };
    } catch (error) {
      if (backedOut(error)) return { kind: 'cancelled', captionCopied: await copying };
      // Any other refusal: fall through and save the picture instead.
    }
  }
  deps.save(file);
  return { kind: 'saved', captionCopied: await copying };
}
