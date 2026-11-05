import js from '@eslint/js';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const FEATURES = ['equacoes'];
const ban = (group, message) => ({ group, message });
const restrict = (...patterns) => ['error', { patterns }];

const noFeatures = ban(
  ['@/features/**', '@/app/**'],
  'shared e lib não importam de features nem de app.',
);
const noHttp = ban(
  ['axios', '@/lib/http', '@/lib/http/**'],
  'HTTP só em api/ via lib/http.',
);
const noUi = ban(
  ['../pages/**', '../components/**'],
  'api não importa pages nem components.',
);
const noPresentation = ban(
  ['@tanstack/react-query', 'zustand', '../api/**'],
  'Componente recebe dados por props.',
);
const noReact = ban(
  ['react', 'react/*', 'react-dom', 'react-dom/*'],
  'model não depende de React.',
);

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'coverage/**',
      'reports/**',
      'node_modules/**',
      'public/**',
      'test/**',
      'src/test/**/*.cjs',
      'jest.*.cjs',
      'jest.config.js',
      'vite.config.mts',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'jsx-a11y': jsxA11y,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.flatConfigs.strict.rules,
      'no-console': 'error',
      'no-ternary': 'error',
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
  {
    files: ['src/shared/**/*.{ts,tsx}'],
    ignores: ['src/shared/**/api/**'],
    rules: {
      'no-restricted-imports': restrict(noFeatures, noHttp),
    },
  },
  {
    files: ['src/shared/**/api/**/*.{ts,tsx}', 'src/lib/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': restrict(noFeatures),
    },
  },
  {
    files: ['src/shared/**/model/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': restrict(noFeatures, noHttp, noReact),
    },
  },
  ...FEATURES.flatMap((f) => {
    const dir = `src/features/${f}`;
    const otherFeatures = FEATURES.filter((o) => o !== f).flatMap((o) => [
      `@/features/${o}`,
      `@/features/${o}/**`,
    ]);
    const extraFeatureBans = [];
    if (otherFeatures.length > 0) {
      extraFeatureBans.push(
        ban(otherFeatures, 'Uma feature não importa de outra.'),
      );
    }
    const rulesList = [
      {
        files: [`${dir}/**/*.{ts,tsx}`],
        ignores: [`${dir}/api/**`, `${dir}/**/*.test.{ts,tsx}`],
        rules: {
          'no-restricted-imports': restrict(...extraFeatureBans, noHttp),
        },
      },
      {
        files: [`${dir}/api/**/*.{ts,tsx}`],
        ignores: [`${dir}/api/**/*.test.{ts,tsx}`],
        rules: {
          'no-restricted-imports': restrict(noUi),
        },
      },
      {
        files: [`${dir}/components/**/*.{ts,tsx}`],
        ignores: [`${dir}/components/**/*.test.{ts,tsx}`],
        rules: {
          'no-restricted-imports': restrict(noHttp, noPresentation),
        },
      },
      {
        files: [`${dir}/model/**/*.{ts,tsx}`],
        ignores: [`${dir}/model/**/*.test.{ts,tsx}`],
        rules: {
          'no-restricted-imports': restrict(noHttp, noReact),
        },
      },
    ];
    return rulesList;
  }),
  {
    files: ['server.js', 'solverFallback.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: globals.node,
    },
    rules: {
      'no-console': 'error',
      'no-ternary': 'error',
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    files: ['src/**/*.test.{ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
);
