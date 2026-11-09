import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { InvitationDesign } from '../invitation';

type Spec = {
  /** The file in `public/invitation/`. */
  file: string;
  /** The part of it that shows, as fractions of the whole photograph. */
  crop: { left: number; top: number; width: number; height: number };
  /** The size it is cut to, in px. */
  width: number;
  height: number;
};

/**
 * The photograph of each design that shows in its link preview, and the part of it that fits. These
 * are the photographs the page ships with (credits in docs/recipient-experience.md), never one a host
 * uploaded, so they are safe to put in a preview that other services copy.
 */
export const DESIGN_PHOTOS: Record<InvitationDesign, Spec> = {
  palace: { file: 'palace-gate.webp', crop: { left: 0, top: 0.17, width: 1, height: 0.69 }, width: 400, height: 552 },
  sage: { file: 'garden-fountain.webp', crop: { left: 0, top: 0.2, width: 1, height: 0.787 }, width: 1200, height: 630 },
  regal: { file: 'baraat-car.webp', crop: { left: 0, top: 0, width: 1, height: 1 }, width: 500, height: 334 },
};

type Sharp = typeof import('sharp');

type Options = {
  /** How to get sharp. Loaded lazily, so a platform without it only loses the photograph. Tests pass their own. */
  loadSharp?: () => Promise<Sharp>;
  /** The folder the photographs are in. */
  folder?: string;
};

async function defaultLoadSharp(): Promise<Sharp> {
  return (await import('sharp')).default as unknown as Sharp;
}

/** Cuts the design's photograph to fit the preview. The renderer cannot draw WebP, so it is re-encoded as JPEG. */
export async function cutDesignPhoto(design: InvitationDesign, options: Options = {}): Promise<string | null> {
  try {
    const sharp = await (options.loadSharp ?? defaultLoadSharp)();
    const spec = DESIGN_PHOTOS[design];
    const file = await readFile(join(options.folder ?? join(process.cwd(), 'public', 'invitation'), spec.file));
    const { width = 0, height = 0 } = await sharp(file).metadata();
    if (!width || !height) return null;
    const bytes = await sharp(file)
      .extract({
        left: Math.round(spec.crop.left * width),
        top: Math.round(spec.crop.top * height),
        width: Math.round(spec.crop.width * width),
        height: Math.round(spec.crop.height * height),
      })
      .resize(spec.width, spec.height, { fit: 'cover' })
      .jpeg({ quality: 82, mozjpeg: true })
      .toBuffer();
    return `data:image/jpeg;base64,${bytes.toString('base64')}`;
  } catch {
    return null;
  }
}

const made = new Map<InvitationDesign, Promise<string | null>>();

/** The design's photograph as a data URL for the preview, or null. Cut once per process. */
export function designPhotoDataUrl(design: InvitationDesign): Promise<string | null> {
  let url = made.get(design);
  if (!url) {
    url = cutDesignPhoto(design);
    made.set(design, url);
  }
  return url;
}

/**
 * A photograph makes the rendered PNG a megabyte or more, and WhatsApp drops a preview image much over
 * 300 KB. Reducing it to a palette keeps it looking the same in a chat and brings it to about 130 KB. Any
 * failure returns the picture as it was.
 */
export async function slimPng(png: ArrayBuffer, options: Pick<Options, 'loadSharp'> = {}): Promise<ArrayBuffer> {
  try {
    const sharp = await (options.loadSharp ?? defaultLoadSharp)();
    const bytes = await sharp(Buffer.from(png)).png({ palette: true, quality: 80, colours: 128, effort: 8 }).toBuffer();
    return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  } catch {
    return png;
  }
}
