/**
 * Fast editor feedback for the layer rules in docs-site/content/architecture.md. The full check
 * (feature-to-feature dependencies, cycles, pure domain, the app shell) is
 * `npm run arch:check`, which also runs in `npm test`: this file only catches the common slips
 * as you type.
 *
 * ESLint does not merge `no-restricted-imports` across overrides: the last matching override
 * wins and replaces the earlier ones. So every override below is built from the same shared
 * pieces and lists everything that applies to its files.
 */

const TEXT_INPUT_PATH = {
  name: 'react-native',
  importNames: ['Text', 'TextInput'],
  message: 'Import Text/TextInput from src/shared/ui/ — font scaling is locked app-wide.',
};

/** Backend, billing, sign-in and storage SDKs. */
const SDK_PATHS = [
  '@react-native-firebase/app',
  '@react-native-firebase/auth',
  '@react-native-firebase/firestore',
  '@react-native-firebase/storage',
  '@react-native-firebase/analytics',
  '@react-native-firebase/crashlytics',
  '@react-native-firebase/app-check',
  '@react-native-google-signin/google-signin',
  '@invertase/react-native-apple-authentication',
  '@react-native-async-storage/async-storage',
  'react-native-purchases',
  'react-native-purchases-ui',
].map((name) => ({
  name,
  message: 'UI must not talk to an SDK: go through an application hook (data/ owns the SDKs).',
}));

const MESSAGING_PATH = {
  name: '@react-native-firebase/messaging',
  message: 'UI must not import messaging — use useFcmRegistration.',
};

const VIEW_PATHS = ['react', 'react-native', 'react-native-svg', 'react-native-reanimated', 'lucide-react-native'];

function restrict({ paths = [], patterns = [] }) {
  return { 'no-restricted-imports': ['error', { paths: [TEXT_INPUT_PATH, ...paths], patterns }] };
}

const FEATURES = Object.keys(require('./scripts/architecture/features.json').features);

/** Imports of another feature's UI or data layer, whatever the relative depth. */
function foreignPatterns(feature) {
  const others = FEATURES.filter((name) => name !== feature);
  return [
    {
      group: others.flatMap((name) => [`**/${name}/ui`, `**/${name}/ui/**`]),
      message: "A feature must not import another feature's UI — move what is shared to src/shared/ui.",
    },
    {
      group: others.flatMap((name) => [`**/${name}/data`, `**/${name}/data/**`]),
      message: "Reach another feature's data through its application hooks or domain, never its data layer.",
    },
  ];
}

const UI_LAYER = {
  // Screens and components: no data layer, no SDKs.
  paths: [...SDK_PATHS, MESSAGING_PATH],
  patterns: [{ group: ['**/data', '**/data/**'], message: 'UI layer must not import data directly — use an application hook.' }],
};
const APPLICATION_LAYER = {
  // Hooks and use-cases: no JSX, so no UI (shared/ui types are fine).
  paths: [],
  patterns: [
    { group: ['**/ui', '**/ui/**', '!**/shared/ui', '!**/shared/ui/**'], message: 'Application must not import UI.' },
  ],
};
const DATA_LAYER = {
  // Repositories and adapters: no React, no screens.
  paths: VIEW_PATHS.map((name) => ({ name, message: 'Data layer must not import React, React Native or view libraries.' })),
  patterns: [
    { group: ['**/ui', '**/ui/**'], message: 'Data layer must not import UI.' },
    { group: ['**/application', '**/application/**'], message: 'Data layer must not import application.' },
  ],
};
const DOMAIN_LAYER = {
  // Pure rules and types: no React, no SDKs, no I/O.
  paths: [...VIEW_PATHS, ...SDK_PATHS.map(({ name }) => name)].map((name) => ({
    name,
    message: 'Domain must stay pure — no React, SDKs or device libraries.',
  })),
  patterns: [
    { group: ['**/data', '**/data/**', '**/ui', '**/ui/**', '**/application', '**/application/**'], message: 'Domain must not import data, application or UI.' },
  ],
};
const LAYERS = { ui: UI_LAYER, application: APPLICATION_LAYER, data: DATA_LAYER, domain: DOMAIN_LAYER };

module.exports = {
  root: true,
  extends: '@react-native',
  rules: {
    // `void promise()` is the codebase's deliberate way to say "fire and forget".
    'no-void': ['warn', { allowAsStatement: true }],
  },
  // docs-site has its own ESLint config (Next.js); the rest is build output or native code.
  ignorePatterns: ['docs-site/', 'functions/', 'vendor/', 'ios/', 'android/', 'node_modules/'],
  overrides: [
    {
      // Plain Node scripts and the jest setup file.
      files: ['scripts/**/*.js', 'jest.setup.js', 'jest.assetStub.js', 'jest.config.js', '.eslintrc.js'],
      env: { node: true, jest: true },
    },
    {
      files: ['src/**/*.{ts,tsx}'],
      excludedFiles: ['src/shared/ui/Text.tsx', 'src/shared/ui/TextInput.tsx'],
      rules: restrict({}),
    },
    // One override per feature and layer, so each lists everything that applies to its files.
    ...FEATURES.flatMap((feature) =>
      Object.entries(LAYERS).map(([layer, rules]) => ({
        files: [`src/features/${feature}/${layer}/**/*.{ts,tsx}`],
        rules: restrict({
          paths: rules.paths,
          patterns: [...rules.patterns, ...foreignPatterns(feature)],
        }),
      })),
    ),
    {
      // Shared sits below features and the app shell.
      files: ['src/shared/**/*.{ts,tsx}'],
      excludedFiles: ['src/shared/ui/Text.tsx', 'src/shared/ui/TextInput.tsx'],
      rules: restrict({
        patterns: [{ group: ['**/features/**', '**/app/**'], message: 'Shared must not import a feature or the app shell.' }],
      }),
    },
  ],
};
