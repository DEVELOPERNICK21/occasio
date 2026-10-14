import sharp from 'sharp';
import { blurredPhotoDataUrl as wash, WASH_SIZE } from './blurredPhoto';

// jest's sandbox cannot run a dynamic import(), so the tests hand over sharp themselves.
const blurredPhotoDataUrl = (
  urls: readonly string[] | undefined,
  options: { allowDemoFiles?: boolean } = {},
) => wash(urls, { ...options, loadSharp: async () => sharp });

async function photoDataUrl(): Promise<string> {
  // A busy picture: stripes of colour, so there is real detail to lose.
  const width = 480;
  const height = 600;
  const raw = Buffer.alloc(width * height * 3);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 3;
      const stripe = Math.floor(x / 6) % 2 === 0;
      raw[i] = stripe ? 230 : 20;
      raw[i + 1] = Math.floor((y / height) * 255);
      raw[i + 2] = stripe ? 40 : 200;
    }
  }
  const png = await sharp(raw, { raw: { width, height, channels: 3 } }).png().toBuffer();
  return `data:image/png;base64,${png.toString('base64')}`;
}

describe('blurredPhotoDataUrl', () => {
  it('turns a photo into a small, soft wash of its colours', async () => {
    const wash = await blurredPhotoDataUrl([await photoDataUrl()]);
    expect(wash).toMatch(/^data:image\/jpeg;base64,/);

    const bytes = Buffer.from(wash!.split(',')[1]!, 'base64');
    expect(bytes.length).toBeLessThan(30_000);
    const meta = await sharp(bytes).metadata();
    expect([meta.width, meta.height]).toEqual([WASH_SIZE.width, WASH_SIZE.height]);
  });

  it('really does lose the detail: the fine stripes are gone', async () => {
    const wash = await blurredPhotoDataUrl([await photoDataUrl()]);
    const { data, info } = await sharp(Buffer.from(wash!.split(',')[1]!, 'base64'))
      .greyscale()
      .raw()
      .toBuffer({ resolveWithObject: true });
    // Neighbouring pixels along a row barely differ once it is this soft.
    let biggestStep = 0;
    for (let x = 1; x < info.width; x += 1) {
      biggestStep = Math.max(biggestStep, Math.abs(data[x]! - data[x - 1]!));
    }
    expect(biggestStep).toBeLessThan(6);
  });

  it('uses only the first photo', async () => {
    const first = await photoDataUrl();
    const alone = await blurredPhotoDataUrl([first]);
    const withMore = await blurredPhotoDataUrl([first, 'data:image/png;base64,AAAA']);
    expect(withMore).toBe(alone);
  });

  it('returns nothing when there are no photos, or the photo is not an image we can read', async () => {
    expect(await blurredPhotoDataUrl(undefined)).toBeNull();
    expect(await blurredPhotoDataUrl([])).toBeNull();
    expect(await blurredPhotoDataUrl(['   '])).toBeNull();
    expect(await blurredPhotoDataUrl(['data:image/png;base64,AAAA'])).toBeNull();
  });

  it('never fetches an address outside our own storage', async () => {
    const fetchSpy = jest.spyOn(globalThis, 'fetch');
    expect(await blurredPhotoDataUrl(['https://evil.example/photo.jpg'])).toBeNull();
    expect(await blurredPhotoDataUrl(['http://169.254.169.254/latest/meta-data'])).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it('only reads files from /public for demo cards, and only the demo photos', async () => {
    // The site runs from docs-site/; the tests run from the repo root.
    const cwd = jest.spyOn(process, 'cwd').mockReturnValue(`${__dirname}/../../..`);
    expect(await blurredPhotoDataUrl(['/demo/photo-1.jpg'])).toBeNull();
    expect(await blurredPhotoDataUrl(['/etc/passwd'], { allowDemoFiles: true })).toBeNull();
    expect(await blurredPhotoDataUrl(['/demo/../../package.json'], { allowDemoFiles: true })).toBeNull();
    const demo = await blurredPhotoDataUrl(['/demo/photo-1.jpg'], { allowDemoFiles: true });
    expect(demo).toMatch(/^data:image\/jpeg;base64,/);
    cwd.mockRestore();
  });

  it('goes without the wash, and never throws, when sharp cannot be loaded', async () => {
    const result = await wash([await photoDataUrl()], {
      loadSharp: async () => {
        throw new Error('no native build for this platform');
      },
    });
    expect(result).toBeNull();
  });
});
