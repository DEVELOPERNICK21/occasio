import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * A soft wash of colour taken from a card's first photo, for the link preview.
 *
 * The preview is copied onto WhatsApp's, Facebook's and others' servers, so the real
 * photo must never go into it. This shrinks the photo to a few dozen pixels and
 * blurs it, which keeps the colours (it feels like theirs) and loses every face and
 * detail. Anything unexpected returns null and the preview simply goes without it.
 */

const DATA_URL = /^data:image\/(?:jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/;
const STORAGE_PREFIX = 'https://firebasestorage.googleapis.com/v0/b/';
const DEMO_FILE = /^\/demo\/[a-z0-9-]{1,40}\.(?:jpg|png)$/;

/** Photos are small by design; anything bigger is not a card photo. */
const MAX_BYTES = 2_000_000;
const FETCH_MS = 2500;
const TOTAL_MS = 4000;

export const WASH_SIZE = { width: 300, height: 380 } as const;

type Sharp = typeof import('sharp');

type Options = {
  /** Demo cards point at files in /public. Real cards never may. */
  allowDemoFiles?: boolean;
  /** How to get sharp. Loaded lazily, so a platform without it only loses the wash. Tests pass their own. */
  loadSharp?: () => Promise<Sharp>;
};

async function defaultLoadSharp(): Promise<Sharp> {
  return (await import('sharp')).default as unknown as Sharp;
}

async function readPhoto(url: string, options: Options): Promise<Buffer | null> {
  const data = DATA_URL.exec(url);
  if (data) {
    const bytes = Buffer.from(data[1]!, 'base64');
    return bytes.length <= MAX_BYTES ? bytes : null;
  }

  if (options.allowDemoFiles && DEMO_FILE.test(url)) {
    return readFile(join(process.cwd(), 'public', url)).catch(() => null);
  }

  // Only our own storage: a card must never make the server fetch somebody else's address.
  if (url.startsWith(STORAGE_PREFIX) && url.length <= 600) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_MS) });
      if (!res.ok) return null;
      const bytes = Buffer.from(await res.arrayBuffer());
      return bytes.length <= MAX_BYTES ? bytes : null;
    } catch {
      return null;
    }
  }

  return null;
}

async function wash(bytes: Buffer, loadSharp: () => Promise<Sharp>): Promise<string | null> {
  try {
    const sharp = await loadSharp();
    // Down to a handful of pixels first: that is what removes the detail for good.
    const tiny = await sharp(bytes, { failOn: 'none', limitInputPixels: 24_000_000 })
      .rotate()
      .resize(24, 30, { fit: 'cover' })
      .toBuffer();
    const soft = await sharp(tiny)
      .resize(WASH_SIZE.width, WASH_SIZE.height, { kernel: 'cubic' })
      .blur(9)
      .modulate({ saturation: 1.15 })
      .jpeg({ quality: 55 })
      .toBuffer();
    return `data:image/jpeg;base64,${soft.toString('base64')}`;
  } catch {
    return null;
  }
}

/** A data URL for the first usable photo, or null. */
export async function blurredPhotoDataUrl(
  urls: readonly string[] | undefined,
  options: Options = {},
): Promise<string | null> {
  const first = (urls ?? []).map((url) => url.trim()).find(Boolean);
  if (!first) return null;

  const work = (async () => {
    const bytes = await readPhoto(first, options);
    return bytes ? wash(bytes, options.loadSharp ?? defaultLoadSharp) : null;
  })();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), TOTAL_MS);
  });
  try {
    return await Promise.race([work, timeout]);
  } finally {
    clearTimeout(timer);
  }
}
