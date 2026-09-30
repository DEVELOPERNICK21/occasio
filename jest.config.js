module.exports = {
  preset: '@react-native/jest-preset',
  // docs-site lib tests (plain TS, no DOM) run here too; skip its build output.
  testPathIgnorePatterns: ['/node_modules/', '/docs-site/.next/', '/functions/lib/'],
  moduleNameMapper: {
    '\\.(mp3|wav)$': '<rootDir>/jest.assetStub.js',
    // The ESM build is .mjs, which jest does not transform.
    '^lucide-react-native$': '<rootDir>/node_modules/lucide-react-native/dist/cjs/lucide-react-native.js',
  },
  setupFiles: ['./jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-native-firebase|@react-native-google-signin|@invertase|firebase|@firebase|react-native-.*|@react-navigation/.*|lucide-react-native)/)',
  ],
};
