import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(__dirname, '../..');
const SOURCE = new Set(['.ts', '.tsx', '.js', '.jsx']);

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

/**
 * Metro resolves an import with no extension by trying ".js", then ".json", then ".ts" and ".tsx". So with
 * "festivalArt.ts" and "festivalArt.json" side by side, `import … from './festivalArt'` loads the JSON in the
 * built app, while Jest and TypeScript pick the .ts file: it passes every test and crashes on a phone.
 */
describe('no data file hides a module of the same name', () => {
  it('has no .json beside a .ts, .tsx or .js file with the same name', () => {
    const clashes: string[] = [];
    {
      const files = walk(path.join(ROOT, 'src'));
      const bases = new Map<string, string[]>();
      for (const file of files) {
        const ext = path.extname(file);
        const key = file.slice(0, -ext.length);
        bases.set(key, [...(bases.get(key) ?? []), ext]);
      }
      for (const [key, exts] of bases) {
        if (exts.includes('.json') && exts.some((e) => SOURCE.has(e))) clashes.push(path.relative(ROOT, key));
      }
    }
    expect([...new Set(clashes)]).toEqual([]);
  });
});
