const path = require('path');

module.exports = {
  env: {
    'browser': true,
    'es2021': true,
    'react-native/react-native': true,
  },
  plugins: ['react', 'react-native'],
  extends: ['@react-native', 'plugin:import/recommended'],
  parser: '@babel/eslint-parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 'latest',
    requireConfigFile: false,
    sourceType: 'module',
    babelOptions: {
      configFile: path.resolve(__dirname, './babel.config.js'),
    },
  },
  root: true,
  rules: {
    // Disable Prettier
    'prettier/prettier': 'off',

    // StraboSpot2 Override default rules
    'arrow-parens': ['error', 'as-needed', {requireForBlockBody: true}],
    'brace-style': ['error', 'stroustrup', {allowSingleLine: true}], // Prettier can't do this so don't use prettier
    'curly': ['error', 'multi-line'],
    'jsx-quotes': ['error', 'prefer-single'],
    'no-unused-vars': ['error', {args: 'none', ignoreRestSiblings: true, destructuredArrayIgnorePattern: '[a-z]'}],
    'object-curly-newline': ['error', {consistent: true}],
    'operator-linebreak': ['error', 'before'],
    'quote-props': ['error', 'consistent'],
    'quotes': ['error', 'single'],
    'react/jsx-sort-props': 'error',

    // StraboSpot2 Override Import rules
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
  },
  settings: {
    'import/ignore': ['react-native'],
  },
};
