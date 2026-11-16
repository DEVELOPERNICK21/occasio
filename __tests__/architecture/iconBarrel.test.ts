import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(__dirname, '../..');
const BARREL = 'src/shared/ui/icons/lucide.ts';

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : /\.(ts|tsx)$/.test(entry.name) ? [full] : [];
  });
}

/**
 * Metro does not remove unused exports. Importing icons from the package root puts all 1,800+ of them
 * in the app (about 600 KB of JavaScript on both platforms), so every icon comes through one barrel
 * that loads each from its own file.
 */
describe('icons come through the barrel', () => {
  it('no source file imports the lucide package root', () => {
    const offenders = walk(path.join(ROOT, 'src'))
      .map((file) => path.relative(ROOT, file))
      .filter((file) => file !== BARREL)
      .filter((file) => /from\s*'lucide-react-native'/.test(fs.readFileSync(path.join(ROOT, file), 'utf8')));
    expect(offenders).toEqual([]);
  });

  it('the barrel loads every icon from its own file, never the whole package', () => {
    const lines = fs.readFileSync(path.join(ROOT, BARREL), 'utf8').split('\n');
    const icons = lines.filter((line) => line.startsWith('export { default as'));
    expect(icons.length).toBeGreaterThan(40);
    for (const line of icons) expect(line).toMatch(/from 'lucide-react-native\/icons\/[a-z0-9-]+';$/);
    // Types only, so nothing is pulled in at runtime.
    expect(lines.filter((line) => line.includes("from 'lucide-react-native';"))).toEqual([
      "export type { LucideIcon, LucideProps } from 'lucide-react-native';",
    ]);
  });
});
