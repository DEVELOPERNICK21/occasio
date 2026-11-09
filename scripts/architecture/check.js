#!/usr/bin/env node
/** npm run arch:check: prints every layering violation and exits 1 if there are any. */
const { buildGraph } = require('./graph');
const { rules } = require('./rules');

const found = rules(buildGraph());
const byRule = new Map();
for (const violation of found) byRule.set(violation.rule, [...(byRule.get(violation.rule) ?? []), violation]);

if (found.length === 0) {
  console.log('Architecture check: no violations.');
  process.exit(0);
}
for (const [rule, items] of byRule) {
  console.log(`\n${rule} (${items.length}) — ${items[0].message}`);
  for (const item of items) console.log(`  ${item.file}${item.to ? `  ->  ${item.to}` : ''}`);
}
console.log(`\n${found.length} violation(s).`);
process.exit(1);
