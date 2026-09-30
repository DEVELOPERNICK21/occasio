module.exports = {
  preset: '@react-native/jest-preset',
  // docs-site tests use node:test and run with its own runner.
  testPathIgnorePatterns: ['/node_modules/', '/docs-site/', '/functions/lib/'],
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
