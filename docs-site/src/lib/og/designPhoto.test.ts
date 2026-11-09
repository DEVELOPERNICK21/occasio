import { join } from 'node:path';
import sharp from 'sharp';
import { DESIGN_PHOTOS, cutDesignPhoto, slimPng } from './designPhoto';

// jest's sandbox cannot run a dynamic import(), so the tests hand over sharp themselves.
const loadSharp = async () => sharp;
const folder = join(__dirname, '..', '..', '..', 'public', 'invitation');

describe('cutDesignPhoto', () => {
  it.each(Object.keys(DESIGN_PHOTOS) as Array<keyof typeof DESIGN_PHOTOS>)(
    'cuts the %s photograph to the size of its place in the preview, and keeps it light',
    async (design) => {
      const url = await cutDesignPhoto(design, { loadSharp, folder });
      expect(url).toMatch(/^data:image\/jpeg;base64,/);

      const bytes = Buffer.from(url!.split(',')[1]!, 'base64');
      const meta = await sharp(bytes).metadata();
      expect([meta.width, meta.height]).toEqual([DESIGN_PHOTOS[design].width, DESIGN_PHOTOS[design].height]);
      // The full-width garden is the largest; the finished preview is slimmed again (see slimPng).
      expect(bytes.length).toBeLessThan(250_000);
    },
  );

  it('goes without a photograph rather than failing when the file or sharp is missing', async () => {
    expect(await cutDesignPhoto('palace', { loadSharp, folder: join(folder, 'nowhere') })).toBeNull();
    const broken = async () => {
      throw new Error('no sharp here');
    };
    expect(await cutDesignPhoto('palace', { loadSharp: broken as never, folder })).toBeNull();
  });
});

describe('slimPng', () => {
  async function busyPng(): Promise<ArrayBuffer> {
    const width = 600;
    const height = 320;
    const raw = Buffer.alloc(width * height * 3);
    for (let i = 0; i < raw.length; i += 1) raw[i] = (i * 2654435761) % 251;
    const png = await sharp(raw, { raw: { width, height, channels: 3 } }).png().toBuffer();
    return png.buffer.slice(png.byteOffset, png.byteOffset + png.byteLength) as ArrayBuffer;
  }

  it('makes a photographic PNG much smaller and still a PNG', async () => {
    const before = await busyPng();
    const after = await slimPng(before, { loadSharp });
    expect(after.byteLength).toBeLessThan(before.byteLength / 2);
    expect((await sharp(Buffer.from(after)).metadata()).format).toBe('png');
  });

  it('hands the picture back as it was when it cannot be slimmed', async () => {
    const before = await busyPng();
    const broken = async () => {
      throw new Error('no sharp here');
    };
    expect(await slimPng(before, { loadSharp: broken as never })).toBe(before);
  });
});
