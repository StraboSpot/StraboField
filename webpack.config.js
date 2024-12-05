// webpack.config.js
const path = require('path');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

const appDirectory = path.resolve(__dirname);

const {presets, plugins} = require(`${appDirectory}/babel.config.js`);
const compileNodeModules = [
  // Add every react-native package that needs compiling
  '@StraboSpot/react-native-sketch-canvas',
  '@react-native',
  '@react-native-community/netinfo',
  '@rnmapbox/maps',
  '@sentry/react-native',
  'react-native',
  'react-native-gesture-handler',
  'react-native-image-picker',
  'react-native-reanimated',
  'react-native-vector-icons',
].map(moduleName => path.resolve(__dirname, `node_modules/${moduleName}`));

const babelLoaderConfiguration = {
  test: /\.(jsx?|tsx?)$/,
  // Add every directory that needs to be compiled by Babel during the build.
  include: [
    path.resolve(__dirname, 'index.web.js'), // Entry to your application
    path.resolve(__dirname, 'App.js'), // Change this to your main App file
    path.resolve(__dirname, 'src'),
    ...compileNodeModules,
  ],
  use: {
    loader: 'babel-loader',
    options: {
      cacheDirectory: true,
      presets,
      plugins: [
        'react-native-web',
        [
          'module-resolver',
          {
            alias: {
              '^react-native$': 'react-native-web',
            },
          },
        ],
        ...plugins],
    },
  },
};

const imageLoaderConfiguration = {
  test: /\.(gif|jpe?g|png|svg)$/,
  use: {
    loader: 'url-loader',
    options: {
      name: '[name].[ext]',
      esModule: false,
    },
  },
};

const ttfLoaderConfiguration = {
  test: /\.ttf$/,
  loader: 'url-loader', // or directly file-loader
  include: [
    path.resolve(appDirectory, 'node_modules/react-native-vector-icons'),
  ],
};

const cssLoaderConfiguration = {
  test: /\.css$/i,
  use: ['style-loader', 'css-loader'],
};

module.exports = {
  entry: [
    './polyfills-web.js',
    path.join(appDirectory, 'index.web.js'),
  ],
  output: {
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/',
    filename: 'bundle.web.js',
  },
  devtool: 'source-map',
  resolve: {
    extensions: ['.web.js', '.js', '.web.ts', '.ts', '.web.jsx', '.jsx', '.web.tsx', '.tsx', '.css', '.json'],
    alias: {
      'react-native$': 'react-native-web',
      'react-native-web': path.resolve('node_modules/react-native-web'),
      '../Utilities/Platform': 'react-native-web/dist/exports/Platform',
    },
  },
  module: {
    rules: [babelLoaderConfiguration, imageLoaderConfiguration, ttfLoaderConfiguration, cssLoaderConfiguration],
  },
  devServer: {
    allowedHosts: 'all',
  },
  plugins: [
    new HtmlWebpackPlugin({template: path.join(__dirname, 'index.html')}),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.DefinePlugin({__DEV__: JSON.stringify(true)}),  // See: <https://github.com/necolas/react-native-web/issues/349>
    new webpack.EnvironmentPlugin({JEST_WORKER_ID: null}),
    new webpack.DefinePlugin({process: {env: {}}}),
  ],
  performance: {
    hints: false,
    maxEntrypointSize: 512000,
    maxAssetSize: 512000,
  },
};
