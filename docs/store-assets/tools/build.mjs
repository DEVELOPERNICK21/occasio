// Renders the screenshot set to exact pixel sizes.
//   node tools/build.mjs            all frames, iOS + Play
//   node tools/build.mjs 01 03      only frames whose id starts with 01 or 03
//   PLATFORM=ios node tools/build.mjs
// Needs: Node 22+, and Chrome / Brave / Edge installed (see cdp.mjs). Fonts load from Google Fonts.
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { launch } from './cdp.mjs';
import { page, background, DESIGN_W } from './design.mjs';
import { buildSlides } from './slides.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(here, '../images');
const only = process.argv.slice(2);
const platforms = process.env.PLATFORM ? [process.env.PLATFORM] : ['ios', 'android'];
const lang = process.env.LANG_ID || 'en-US';
const TARGETS = {
  ios: { dir: `${OUT}/app-store/iphone-6.9`, w: 1320, h: 2868 },
  android: { dir: `${OUT}/google-play/phone`, w: 1080, h: 1920 },
};

mkdirSync(resolve(here, '.gen'), { recursive: true });
const b = await launch();
const slides = buildSlides(lang);

for (const platform of platforms) {
  const t = TARGETS[platform];
  mkdirSync(t.dir, { recursive: true });
  const H = Math.round(t.h * (DESIGN_W / t.w));
  await b.viewport(t.w, t.h, 1, false);
  for (const s of slides) {
    if (only.length && !only.some((o) => s.id.startsWith(o))) continue;
    const html = page({ canvasW: t.w, canvasH: t.h, H, platform, bg: background(s.hue), body: s.build({ H, platform }) });
    const file = resolve(here, `.gen/${platform}-${s.id}.html`);
    writeFileSync(file, html);
    await b.navigate(pathToFileURL(file).href, 600);
    await b.evaluate(`Promise.all([document.fonts.ready, ...[...document.images].map(i => i.decode().catch(() => {}))]).then(() => true)`);
    await b.sleep(500);
    await b.shot(`${t.dir}/${s.id}.png`);
    console.log('✓', platform, s.id);
  }
}
await b.close();
