import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(__dirname, '../..');
const IOS = join(ROOT, 'ios/Occasio/Images.xcassets/AppIcon.appiconset');
const RES = join(ROOT, 'android/app/src/main/res');

/** Width, height and PNG colour type from the IHDR chunk (types 4 and 6 carry an alpha channel). */
function png(path: string) {
  const bytes = readFileSync(path);
  expect(bytes.subarray(1, 4).toString('ascii')).toBe('PNG');
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20), colorType: bytes[25] };
}
const hasAlpha = (colorType: number) => colorType === 4 || colorType === 6;

describe('iOS app icon', () => {
  const contents = JSON.parse(readFileSync(join(IOS, 'Contents.json'), 'utf8')) as {
    images: { filename: string; size: string; scale: string; idiom: string }[];
  };

  it('has every file the catalog lists, at exactly the size it asks for', () => {
    for (const entry of contents.images) {
      const file = join(IOS, entry.filename);
      expect(existsSync(file)).toBe(true);
      const expected = Math.round(parseFloat(entry.size) * parseInt(entry.scale, 10));
      const { width, height } = png(file);
      expect([entry.filename, width, height]).toEqual([entry.filename, expected, expected]);
    }
  });

  it('has no alpha channel anywhere: App Store Connect rejects a transparent 1024 icon', () => {
    for (const entry of contents.images) {
      expect([entry.filename, hasAlpha(png(join(IOS, entry.filename)).colorType)]).toEqual([
        entry.filename,
        false,
      ]);
    }
  });

  it('includes the 1024 marketing icon', () => {
    const marketing = contents.images.find((entry) => entry.idiom === 'ios-marketing');
    expect(marketing?.size).toBe('1024x1024');
  });
});

describe('brand source art', () => {
  it('keeps the full icon square, 1024 and opaque, since every platform file is made from it', () => {
    const { width, height, colorType } = png(join(ROOT, 'assets/brand/app-icon-1024.png'));
    expect([width, height]).toEqual([1024, 1024]);
    expect(hasAlpha(colorType)).toBe(false);
  });

  it('ships the same opaque icon to the App Store listing assets', () => {
    const { width, colorType } = png(join(ROOT, 'docs/store-assets/images/app-store/app-icon-1024.png'));
    expect(width).toBe(1024);
    expect(hasAlpha(colorType)).toBe(false);
  });
});

describe('Android icons', () => {
  const adaptive = readFileSync(join(RES, 'mipmap-anydpi-v26/ic_launcher.xml'), 'utf8');

  it('uses a foreground, a background and a monochrome layer that all exist', () => {
    expect(adaptive).toContain('<monochrome android:drawable="@mipmap/ic_launcher_monochrome"/>');
    expect(existsSync(join(RES, 'drawable/ic_launcher_background.xml'))).toBe(true);
    for (const density of ['mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi']) {
      for (const layer of ['ic_launcher_foreground', 'ic_launcher_monochrome', 'ic_launcher', 'ic_launcher_round']) {
        expect([density, layer, existsSync(join(RES, `mipmap-${density}/${layer}.png`))]).toEqual([
          density,
          layer,
          true,
        ]);
      }
    }
  });

  it('keeps the round icon in step with the square one', () => {
    expect(readFileSync(join(RES, 'mipmap-anydpi-v26/ic_launcher_round.xml'), 'utf8')).toBe(adaptive);
  });

  it('draws the adaptive layers on the 108dp canvas', () => {
    expect(png(join(RES, 'mipmap-xxxhdpi/ic_launcher_foreground.png')).width).toBe(432);
    expect(png(join(RES, 'mipmap-mdpi/ic_launcher_monochrome.png')).width).toBe(108);
  });

  it('has a notification glyph for every density, registered in the manifest', () => {
    const sizes: Record<string, number> = { mdpi: 24, hdpi: 36, xhdpi: 48, xxhdpi: 72, xxxhdpi: 96 };
    for (const [density, size] of Object.entries(sizes)) {
      expect(png(join(RES, `drawable-${density}/ic_stat_occasio.png`)).width).toBe(size);
    }
    const manifest = readFileSync(join(ROOT, 'android/app/src/main/AndroidManifest.xml'), 'utf8');
    expect(manifest).toContain('default_notification_icon');
    expect(manifest).toContain('@drawable/ic_stat_occasio');
  });
});

describe('website icons', () => {
  it('keeps every PNG inside favicon.ico in RGBA, which is all Next.js will build', () => {
    const ico = readFileSync(join(ROOT, 'docs-site/src/app/favicon.ico'));
    const count = ico.readUInt16LE(4);
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i += 1) {
      const entry = 6 + i * 16;
      const offset = ico.readUInt32LE(entry + 12);
      // Small sizes may be stored as bitmaps; the PNG ones are the ones Next decodes.
      if (ico.subarray(offset + 1, offset + 4).toString('ascii') === 'PNG') {
        expect(ico[offset + 25]).toBe(6);
      }
    }
  });
});
