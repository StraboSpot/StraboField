module.exports = {
  presets: ['module:@react-native/babel-preset'],
  env: {
    production: {
      plugins: [
        'transform-remove-console',
        'react-native-reanimated/plugin',
      ],
    },
    development: {
      plugins: [
        ['@babel/plugin-transform-react-jsx', {runtime: 'classic'}],
        'react-native-reanimated/plugin',
      ],
    },
  },
  plugins: [
    '@babel/plugin-transform-export-namespace-from',
    ['react-native-worklets/plugin'],
  ],
};
