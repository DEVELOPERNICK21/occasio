#!/usr/bin/env node
/**
 * Fetch Stitch screen HTML + screenshot for reference.
 * Requires STITCH_API_KEY in docs-site/.env.local or environment.
 *
 * Usage:
 *   node scripts/fetch-stitch-screen.mjs <projectId> <screenId> [outputName]
 */
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stitch } from '@google/stitch-sdk';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function loadEnvLocal() {
  try {
    const raw = readFileSync(join(root, '.env.local'), 'utf8');
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    // optional
  }
}

loadEnvLocal();

const [projectId, screenId, outputName = screenId] = process.argv.slice(2);
if (!projectId || !screenId) {
  console.error(
    'Usage: node scripts/fetch-stitch-screen.mjs <projectId> <screenId> [outputName]',
  );
  process.exit(1);
}

if (!process.env.STITCH_API_KEY && !process.env.STITCH_ACCESS_TOKEN) {
  console.error(
    'Missing STITCH_API_KEY. Add it to docs-site/.env.local (from stitch.withgoogle.com/settings).',
  );
  process.exit(1);
}

const outDir = join(root, 'stitch_exports', projectId);
mkdirSync(outDir, { recursive: true });

const project = stitch.project(projectId);
const screen = await project.getScreen(screenId);
const htmlUrl = await screen.getHtml();
const imageUrl = await screen.getImage();

console.log('HTML URL:', htmlUrl);
console.log('Image URL:', imageUrl);

const htmlRes = await fetch(htmlUrl);
const imgRes = await fetch(imageUrl);
if (!htmlRes.ok) throw new Error(`HTML download failed: ${htmlRes.status}`);
if (!imgRes.ok) throw new Error(`Image download failed: ${imgRes.status}`);

const htmlPath = join(outDir, `${outputName}.html`);
const imgPath = join(outDir, `${outputName}.png`);
writeFileSync(htmlPath, Buffer.from(await htmlRes.arrayBuffer()));
writeFileSync(imgPath, Buffer.from(await imgRes.arrayBuffer()));

console.log('Saved:', htmlPath);
console.log('Saved:', imgPath);
