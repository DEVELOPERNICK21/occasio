#!/usr/bin/env node
/**
 * Moves files and rewrites every relative import that pointed at them (or that they point
 * at), in src/, __tests__/, App.tsx and the root jest/index files, including `jest.mock`,
 * `jest.requireActual` and dynamic `import()` strings.
 *
 *   node scripts/architecture/move.js <from> <to> [<from> <to> ...]
 *
 * Paths are relative to the repo root. Run `npm run typecheck && npm test` afterwards.
 */
const fs = require('fs');
const path = require('path');
const { ROOT } = require('./graph');

const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.json'];

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) out.push(full);
  }
  return out;
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

function relativeSpec(fromFile, toFile, keepExtension) {
  let rel = path.relative(path.dirname(fromFile), toFile).split(path.sep).join('/');
  if (!keepExtension) rel = rel.replace(/\.(tsx?|jsx?)$/, '');
  return rel.startsWith('.') ? rel : `./${rel}`;
}

function main(args) {
  if (args.length === 0 || args.length % 2 !== 0) {
    console.error('usage: move.js <from> <to> [<from> <to> ...]');
    process.exit(2);
  }
  const moves = new Map();
  for (let i = 0; i < args.length; i += 2) {
    const from = path.resolve(ROOT, args[i]);
    const to = path.resolve(ROOT, args[i + 1]);
    if (!fs.existsSync(from)) throw new Error(`missing: ${args[i]}`);
    if (fs.existsSync(to)) throw new Error(`already exists: ${args[i + 1]}`);
    moves.set(from, to);
  }

  const scanned = [
    ...walk(path.join(ROOT, 'src')),
    ...walk(path.join(ROOT, '__tests__')),
    ...['App.tsx', 'index.js', 'jest.setup.js', 'jest.config.js'].map((f) => path.join(ROOT, f)).filter((f) => fs.existsSync(f)),
  ];

  const rewritten = [];
  for (const file of scanned) {
    const newFile = moves.get(file) ?? file;
    const source = fs.readFileSync(file, 'utf8');
    const next = source.replace(/(['"])(\.{1,2}\/[^'"\n]*|\.{1,2})\1/g, (whole, quote, spec) => {
      const resolved = resolveFile(path.resolve(path.dirname(file), spec));
      if (!resolved) return whole;
      const target = moves.get(resolved) ?? resolved;
      if (target === resolved && newFile === file) return whole;
      const pointsAtDirectory = !path.basename(spec).includes('.') && path.basename(resolved).startsWith('index.') && !/index$/.test(spec);
      const keepExtension = /\.(json|png|jpe?g|mp3|wav|svg|gif|webp)$/.test(spec);
      const out = pointsAtDirectory
        ? relativeSpec(newFile, path.dirname(target), true)
        : relativeSpec(newFile, target, keepExtension);
      return `${quote}${out}${quote}`;
    });
    if (next !== source || newFile !== file) rewritten.push({ file, newFile, next });
  }

  for (const { file, newFile, next } of rewritten) {
    fs.mkdirSync(path.dirname(newFile), { recursive: true });
    fs.writeFileSync(newFile, next);
    if (newFile !== file) fs.rmSync(file);
  }
  for (const [from, to] of moves) console.log(`moved ${path.relative(ROOT, from)} -> ${path.relative(ROOT, to)}`);
  console.log(`${rewritten.length} file(s) written.`);
}

main(process.argv.slice(2));
