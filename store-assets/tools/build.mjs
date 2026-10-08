// Renders every store graphic to exact pixel sizes.
//   node tools/build.mjs            all slides, iOS + Play
//   node tools/build.mjs 01 03      only slides whose id starts with 01 or 03
//   PLATFORM=ios node tools/build.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { launch } from './cdp.mjs';
import { page, background, DESIGN_W } from './design.mjs';
import { slides } from './slides.mjs';

const only = process.argv.slice(2);
const platforms = process.env.PLATFORM ? [process.env.PLATFORM] : ['ios', 'android'];
const TARGETS = {
  ios: { dir: 'out/app-store/iphone-6.9', w: 1320, h: 2868 },
  android: { dir: 'out/google-play/phone', w: 1080, h: 1920 },
};

mkdirSync('tools/.gen', { recursive: true });
const b = await launch();

for (const platform of platforms) {
  const t = TARGETS[platform];
  mkdirSync(t.dir, { recursive: true });
  const H = Math.round(t.h * (DESIGN_W / t.w));
  await b.viewport(t.w, t.h, 1, false);
  for (const s of slides) {
    if (only.length && !only.some((o) => s.id.startsWith(o))) continue;
    const html = page({ canvasW: t.w, canvasH: t.h, H, platform, bg: background(s.hue), body: s.build({ H, platform }) });
    const file = resolve(`tools/.gen/${platform}-${s.id}.html`);
    writeFileSync(file, html);
    await b.navigate(pathToFileURL(file).href, 600);
    await b.evaluate(`Promise.all([document.fonts.ready, ...[...document.images].map(i => i.decode().catch(() => {}))]).then(() => true)`);
    await b.sleep(500);
    await b.shot(`${t.dir}/${s.id}.png`);
    console.log('✓', platform, s.id);
  }
}
await b.close();
