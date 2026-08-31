module.exports = {
  root: true,
  extends: '@react-native',
  overrides: [
    {
      files: ['src/**/*.{ts,tsx}'],
      excludedFiles: [
        'src/shared/ui/Text.tsx',
        'src/shared/ui/TextInput.tsx',
      ],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            paths: [
              {
                name: 'react-native',
                importNames: ['Text', 'TextInput'],
                message:
                  'Import Text/TextInput from src/shared/ui/ — font scaling is locked app-wide.',
              },
            ],
          },
        ],
      },
    },
    {
      files: ['src/features/**/ui/**/*.{ts,tsx}'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              {
                group: ['**/features/*/data', '**/features/*/data/*'],
                message:
                  'UI layer must not import data directly — use application hooks.',
              },
            ],
          },
        ],
      },
    },
    {
      files: ['src/features/**/data/**/*.{ts,tsx}'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              {
                group: ['react', 'react-native', 'react-native/*'],
                message: 'Data layer must not import React Native.',
              },
              {
                group: ['**/features/*/ui', '**/features/*/ui/*'],
                message: 'Data layer must not import UI.',
              },
            ],
          },
        ],
      },
    },
    {
      files: ['src/features/**/domain/**/*.{ts,tsx}'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              {
                group: ['react', 'react-native', 'react-native/*'],
                message: 'Domain must stay pure — no React imports.',
              },
            ],
          },
        ],
      },
    },
  ],
};
