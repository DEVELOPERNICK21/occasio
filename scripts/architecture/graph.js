/**
 * The app's import graph: every source file, what it imports (resolved to a real file or a
 * package), and where it sits (feature + layer, or shared). The layering rules are checked
 * against this, not against import strings, because every import in this repo is relative.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const SRC = path.join(ROOT, 'src');
const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.json'];
const LAYERS = ['ui', 'application', 'domain', 'data'];

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '__tests__') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(entry.name) && !/\.d\.ts$/.test(entry.name)) out.push(full);
  }
  return out;
}

/** Source files of the app: everything under src/, plus App.tsx. */
function sourceFiles() {
  return [...walk(SRC), path.join(ROOT, 'App.tsx')].filter((file) => fs.existsSync(file));
}

/** Comments out, so an import mentioned in a doc comment is not counted. Strings are left alone. */
function stripComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:'"`\\])\/\/.*$/gm, '$1');
}

/** Every module specifier a file imports, with whether the import is type-only. */
function parseImports(source) {
  const code = stripComments(source);
  const found = [];
  const add = (spec, typeOnly) => found.push({ spec, typeOnly });
  const from = /\b(import|export)\s+(type\s+)?(?:[^'";]*?\s+from\s*)['"]([^'"]+)['"]/g;
  let match;
  while ((match = from.exec(code))) add(match[3], Boolean(match[2]));
  const bare = /\bimport\s*['"]([^'"]+)['"]/g;
  while ((match = bare.exec(code))) add(match[1], false);
  const dynamic = /\b(?:import|require)\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  while ((match = dynamic.exec(code))) add(match[1], false);
  return found;
}

function resolveFile(base) {
  if (fs.existsSync(base) && fs.statSync(base).isFile()) return base;
  for (const ext of EXTENSIONS) if (fs.existsSync(base + ext)) return base + ext;
  for (const ext of EXTENSIONS) {
    const index = path.join(base, `index${ext}`);
    if (fs.existsSync(index)) return index;
  }
  return null;
}

/** A specifier, resolved: a project file, a package, or something else (an asset, unresolved). */
function resolveImport(fromFile, spec) {
  if (spec.startsWith('.')) {
    const target = resolveFile(path.resolve(path.dirname(fromFile), spec));
    return target ? { kind: 'file', file: target } : { kind: 'other', spec };
  }
  const name = spec.startsWith('@') ? spec.split('/').slice(0, 2).join('/') : spec.split('/')[0];
  return { kind: 'package', name, spec };
}

/** Where a project file sits. */
function classify(file) {
  const rel = path.relative(ROOT, file).split(path.sep);
  if (rel[0] === 'App.tsx') return { area: 'app', path: rel.join('/') };
  if (rel[0] !== 'src') return { area: 'other', path: rel.join('/') };
  if (rel[1] === 'features') {
    const layer = LAYERS.includes(rel[3]) ? rel[3] : 'other';
    return { area: 'feature', feature: rel[2], layer, path: rel.join('/') };
  }
  if (rel[1] === 'shared') return { area: 'shared', part: rel[2], path: rel.join('/') };
  if (rel[1] === 'app') return { area: 'app', path: rel.join('/') };
  return { area: 'other', path: rel.join('/') };
}

/** { file, info, source, imports: [{ spec, typeOnly, target }] } for every source file. */
function buildGraph() {
  return sourceFiles().map((file) => {
    const source = fs.readFileSync(file, 'utf8');
    return {
      file,
      info: classify(file),
      source,
      imports: parseImports(source).map((item) => ({ ...item, target: resolveImport(file, item.spec) })),
    };
  });
}

module.exports = { ROOT, SRC, LAYERS, buildGraph, classify, parseImports, stripComments, resolveImport };
