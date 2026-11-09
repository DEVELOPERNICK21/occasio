/**
 * The layering rules, from docs-site/content/architecture.md, trd.md and data-flow.md:
 *
 *   ui -> application -> domain <- data          inside a feature
 *   src/app (and App.tsx)  ->  features  ->  shared    between them
 *
 * Each rule returns violations: { rule, file, to, message }. They are checked against the real
 * import graph (graph.js), so a relative import is seen as what it is, not as a string.
 */
const fs = require('fs');
const path = require('path');
const { ROOT, stripComments } = require('./graph');

const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'features.json'), 'utf8'));

/** Backend, billing, sign-in and storage SDKs: a screen never talks to these. */
const SDK = [
  /^@react-native-firebase\//,
  /^firebase(\/|$)/,
  /^react-native-purchases/,
  /^@react-native-google-signin\//,
  /^@invertase\/react-native-apple-authentication$/,
  /^@react-native-async-storage\/async-storage$/,
];
const isSdk = (name) => SDK.some((pattern) => pattern.test(name));

/** Libraries that only make sense in a view. Device and billing SDKs are not on this list. */
const VIEW_PACKAGES = new Set([
  'react',
  'react-dom',
  'react-native',
  'react-native-svg',
  'react-native-reanimated',
  'react-native-gesture-handler',
  'react-native-safe-area-context',
  'react-native-screens',
  'lottie-react-native',
  'lucide-react-native',
]);
const isViewPackage = (name) => VIEW_PACKAGES.has(name) || name.startsWith('@react-navigation/');

/**
 * Colours live in src/shared/theme/tokens.ts and nowhere else. These files are the exceptions,
 * because the colours are the artwork or the product data itself, not the interface:
 */
const COLOUR_ARTWORK = {
  'src/shared/theme/tokens.ts': 'the tokens themselves',
  'src/shared/ui/Pip.tsx': 'the mascot is artwork',
  'src/features/create/domain/templateTheme.ts': 'template palettes are product data, kept here so domain stays pure',
  'src/features/create/ui/components/effects/PremiumScreenEffect.tsx': 'celebration artwork',
  'src/features/create/ui/components/effects/GlossyBalloon.tsx': 'celebration artwork',
  'src/features/create/ui/components/effects/RisingHeart.tsx': 'celebration artwork',
  'src/features/auth/ui/components/GoogleGIcon.tsx': "Google's brand colours must not be changed",
};
const HARD_CODED_COLOUR = /['"`](#[0-9A-Fa-f]{3,8}|(?:rgba?|hsla?)\()/;

const rel = (file) => path.relative(ROOT, file).split(path.sep).join('/');

function edgesOf(node) {
  return node.imports.map((item) => ({ ...item, to: item.target.kind === 'file' ? item.target.file : null }));
}

/** A shared file is pure when it imports no package and only other pure shared files (constants, plain rules). */
function pureSharedChecker(graph) {
  const nodes = new Map(graph.map((node) => [node.file, node]));
  const memo = new Map();
  const isPure = (file, trail = new Set()) => {
    if (memo.has(file)) return memo.get(file);
    const node = nodes.get(file);
    if (!node || node.info.area !== 'shared' || ['ui', 'theme', 'navigation'].includes(node.info.part)) return false;
    if (trail.has(file)) return true;
    trail.add(file);
    const pure = edgesOf(node).every((edge) => {
      if (edge.target.kind === 'package') return false;
      return edge.to ? isPure(edge.to, trail) : true;
    });
    memo.set(file, pure);
    return pure;
  };
  return isPure;
}

function findCycle(adjacency) {
  const state = new Map();
  const stack = [];
  const visit = (name) => {
    state.set(name, 1);
    stack.push(name);
    for (const next of adjacency.get(name) ?? []) {
      if (state.get(next) === 1) return [...stack.slice(stack.indexOf(next)), next];
      if (!state.get(next)) {
        const found = visit(next);
        if (found) return found;
      }
    }
    stack.pop();
    state.set(name, 2);
    return null;
  };
  for (const name of adjacency.keys()) if (!state.get(name)) {
    const found = visit(name);
    if (found) return found;
  }
  return null;
}

function rules(graph) {
  const info = new Map(graph.map((node) => [node.file, node.info]));
  const isPureShared = pureSharedChecker(graph);
  const violations = [];
  const report = (rule, node, to, message) => violations.push({ rule, file: rel(node.file), to: to ?? '', message });

  const used = new Map(); // "a>b" -> first file that uses it
  const layerEdges = { domain: new Map(), data: new Map() };

  for (const node of graph) {
    const here = node.info;
    for (const edge of edgesOf(node)) {
      const there = edge.to ? info.get(edge.to) : null;
      const pkg = edge.target.kind === 'package' ? edge.target.name : null;
      const target = edge.to ? rel(edge.to) : edge.spec;

      if (here.area === 'feature') {
        if (here.layer === 'ui') {
          if (there?.area === 'feature' && there.layer === 'data') {
            report('ui-imports-data', node, target, 'UI must go through an application hook, never import data.');
          }
          if (pkg && isSdk(pkg)) {
            report('ui-imports-sdk', node, pkg, 'UI must not import Firebase, RevenueCat, Google/Apple sign-in or storage SDKs.');
          }
        }
        if (here.layer === 'application' && there?.area === 'feature' && there.layer === 'ui') {
          report('application-imports-ui', node, target, 'Application (hooks) must not import UI.');
        }
        if (here.layer === 'data') {
          if (pkg && isViewPackage(pkg)) {
            report('data-imports-view', node, pkg, 'Data must not import React, React Native or view libraries.');
          }
          if (there?.area === 'feature' && (there.layer === 'ui' || there.layer === 'application')) {
            report('data-imports-view', node, target, 'Data must not import UI or application.');
          }
          if (there?.area === 'shared' && (there.part === 'ui' || there.part === 'navigation')) {
            report('data-imports-view', node, target, 'Data must not import shared UI or navigation.');
          }
        }
        if (here.layer === 'domain') {
          if (pkg) {
            report('domain-impure', node, pkg, 'Domain is pure: no packages (React, SDKs, device libraries).');
          } else if (there) {
            const sameKind = there.area === 'feature' && there.layer === 'domain';
            if (!sameKind && !(there.area === 'shared' && isPureShared(edge.to))) {
              report('domain-impure', node, target, 'Domain may only import other domain files and pure shared constants.');
            }
          }
        }
        if (there?.area === 'feature' && there.feature !== here.feature) {
          const key = `${here.feature}>${there.feature}`;
          if (!used.has(key)) used.set(key, rel(node.file));
          if (there.layer === 'ui') {
            report('feature-imports-foreign-ui', node, target, "A feature must not import another feature's UI: move what is shared to shared/ui.");
          } else if (there.layer === 'data') {
            report('feature-imports-foreign-data', node, target, "Reach another feature's data through its application hooks or domain, never its data layer.");
          }
          if (!(config.features[here.feature] ?? []).includes(there.feature)) {
            report('feature-dependency-undeclared', node, target, `${here.feature} may not depend on ${there.feature} (scripts/architecture/features.json).`);
          }
          for (const layer of ['domain', 'data']) {
            if (here.layer === layer && there.layer === layer) {
              const set = layerEdges[layer].get(here.feature) ?? new Set();
              set.add(there.feature);
              layerEdges[layer].set(here.feature, set);
            }
          }
        }
      }

      if (here.area === 'shared' && there && (there.area === 'feature' || there.area === 'app')) {
        report('shared-imports-feature', node, target, 'Shared sits below features: it must not import from a feature or from src/app.');
      }
      if (here.area === 'app' && there?.area === 'feature' && there.layer === 'data') {
        report('app-imports-data', node, target, 'The app shell uses a feature through its application, domain or UI, never its data layer.');
      }
      if (here.area === 'feature' && there?.area === 'app') {
        report('feature-imports-app', node, target, 'A feature must not import the app shell (src/app).');
      }
    }

    // Domain stays typed: no `any`.
    if (here.area === 'feature' && here.layer === 'domain') {
      if (/(:\s*any\b|\bas\s+any\b|<any>|\bany\[\])/.test(stripComments(node.source))) {
        report('domain-any', node, '', 'No `any` in domain.');
      }
    }

    // Colours come from the tokens.
    if (
      (here.area === 'feature' || here.area === 'shared' || here.area === 'app') &&
      !(here.path in COLOUR_ARTWORK) &&
      HARD_CODED_COLOUR.test(stripComments(node.source))
    ) {
      report('hard-coded-colour', node, '', 'Use a token from src/shared/theme/tokens.ts, or add one there.');
    }

    // No network call straight from a screen.
    if (here.area === 'feature' && here.layer === 'ui' && /(^|[^.\w])fetch\s*\(/.test(stripComments(node.source))) {
      report('ui-uses-fetch', node, '', 'UI must not call fetch: all HTTP lives in data repositories.');
    }
  }

  // A dependency nothing uses is a lie in the map.
  const mutual = new Set(config.mutual.flatMap(({ features }) => [`${features[0]}>${features[1]}`, `${features[1]}>${features[0]}`]));
  for (const [feature, allowed] of Object.entries(config.features)) {
    for (const dep of allowed) {
      if (!used.has(`${feature}>${dep}`)) {
        violations.push({
          rule: 'feature-dependency-stale',
          file: `scripts/architecture/features.json`,
          to: `${feature} -> ${dep}`,
          message: 'Declared but unused: remove it from the map so the map stays true.',
        });
      }
    }
  }

  // Features form a graph: no loops, except the pairs declared as mutual.
  const declared = new Map(Object.entries(config.features).map(([name, deps]) => [name, deps.filter((dep) => !mutual.has(`${name}>${dep}`))]));
  const loop = findCycle(declared);
  if (loop) {
    violations.push({
      rule: 'feature-cycle',
      file: 'scripts/architecture/features.json',
      to: loop.join(' -> '),
      message: 'The declared feature dependencies loop. Break the loop, or declare the pair as mutual with a reason.',
    });
  }
  // The lower layers must never loop between features, mutual or not.
  for (const layer of ['domain', 'data']) {
    const loopInLayer = findCycle(layerEdges[layer]);
    if (loopInLayer) {
      violations.push({
        rule: `${layer}-cycle`,
        file: 'src/features',
        to: loopInLayer.join(' -> '),
        message: `Features' ${layer} layers import each other in a loop.`,
      });
    }
  }
  return violations;
}

module.exports = { rules, isSdk, isViewPackage, config, COLOUR_ARTWORK };
