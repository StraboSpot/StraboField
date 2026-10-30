const path = require('path');

const reactNativeConfig = require('@react-native/eslint-config/flat');
const importPlugin = require('eslint-plugin-import');
const reactNativePlugin = require('eslint-plugin-react-native');
const globals = require('globals');

module.exports = [
  {
    // dist/ is webpack build output: bundled, minified vendor code, not ours to lint. Flat config lints dotfiles, so
    // they need excluding too.
    ignores: ['dist/', '**/.*', '**/.*/'],
  },
  {
    // Before the React Native config so its globals win where the two disagree
    languageOptions: {
      globals: {...globals.browser, ...reactNativePlugin.environments['react-native'].globals},
    },
  },
  ...reactNativeConfig,
  importPlugin.flatConfigs.recommended,
  {
    files: ['**/*.js', '**/*.jsx'],
    languageOptions: {
      parserOptions: {
        requireConfigFile: false,
        babelOptions: {
          configFile: path.resolve(__dirname, './babel.config.js'),
        },
      },
    },
  },
  {
    // Jest globals for test files and test infrastructure (mocks, custom environments).
    files: ['**/*.test.js', '**/__tests__/**', 'jest/**/*.js'],
    languageOptions: {
      globals: globals.jest,
    },
  },
  {
    languageOptions: {
      ecmaVersion: 'latest',
    },
    rules: {
      // Disable Prettier
      'prettier/prettier': 'off',

      // StraboSpot2 Override default rules
      'arrow-parens': ['error', 'as-needed', {requireForBlockBody: true}],
      'brace-style': ['error', 'stroustrup', {allowSingleLine: true}], // Prettier can't do this so don't use prettier
      'curly': ['error', 'multi-line'],
      'jsx-quotes': ['error', 'prefer-single'],
      'no-unused-vars': ['error', {
        args: 'none',
        caughtErrors: 'none',
        ignoreRestSiblings: true,
        destructuredArrayIgnorePattern: '[a-z]',
      }],
      'object-curly-newline': ['error', {consistent: true}],
      'operator-linebreak': ['error', 'before'],
      'quote-props': ['error', 'consistent'],
      'quotes': ['error', 'single'],
      'react/jsx-sort-props': 'error',

      // StraboSpot2 Override Import rules
      'import/namespace': 'off', // Too many false positives with React Native namespace imports (e.g. MapboxGL)
      'import/no-unresolved': ['error', {ignore: ['react-map-gl/mapbox', 'uuid']}],
      'import/order': ['error', {
        'groups': ['builtin', 'external', 'internal'],
        'pathGroups': [{pattern: '{react,react-native}', group: 'external', position: 'before'}],
        'pathGroupsExcludedImportTypes': ['react', 'react-native'],
        'newlines-between': 'always',
        'alphabetize': {order: 'asc', caseInsensitive: true},
      }],

      // StraboSpot2 Sort StyleSheets
      'react-native/sort-styles': ['error', 'asc', {'ignoreClassNames': false, 'ignoreStyleProperties': false}],

      // StraboSpot2 Override React rules
      'react/jsx-filename-extension': [1, {extensions: ['.js', '.jsx']}], // allow .js files to contain JSX code
      // Catches a component defined inline and passed as a prop, e.g. <Formik component={props => <Form {...props}/>}>:
      // the arrow is a new function each render, so React remounts the subtree instead of updating it. Pass the render
      // function as children instead. Only fires when the arrow returns JSX, not when it calls Form(...) as a function.
      'react/no-unstable-nested-components': ['error', {allowAsProps: false}],
      'react-hooks/exhaustive-deps': 'off',
      'react-native/no-inline-styles': 'off',
    },
    settings: {
      'import/ignore': ['react-native', 'react-map-gl', '@rnmapbox/maps', 'uuid'],
    },
  },
];
