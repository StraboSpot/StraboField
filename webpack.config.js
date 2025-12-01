// webpack.config.js
const path = require('path');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
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

// Added when updated @react-navigation/native to 7.0.1 to make it work on web
// but this wasn't in any update instructions
// ToDo Check if we can get rid of this
const addedForReactNavigation = {
  test: /\.m?js/,
  resolve: {
    fullySpecified: false,
  },
};

module.exports = (env, argv) => {
  const mode = argv.mode || 'development'; // dev mode by default
  return {
    // stats: {
    //   errorDetails: true,
    //   children: true,
    // },
    entry: [
      './polyfills-web.js',
      path.join(appDirectory, 'index.web.js'),
    ],
    output: {
      path: path.resolve(__dirname, 'dist'),
      publicPath: '/',
      filename: '[name].bundle.js',
    },
    mode,
    devtool: false, // disables source maps
    resolve: {
      extensions: ['.web.js', '.js', '.web.ts', '.ts', '.web.jsx', '.jsx', '.web.tsx', '.tsx', '.css', '.json'],
      alias: {
        'react-native$': 'react-native-web',
        'react-native-web': path.resolve('node_modules/react-native-web'),
        '../Utilities/Platform': 'react-native-web/dist/exports/Platform',
        '@bam.tech/react-native-image-resizer': path.resolve(__dirname,
          'src/modules/images/react-native-image-resizer.web.js'),
      },
    },
    module: {
      rules: [babelLoaderConfiguration, imageLoaderConfiguration, ttfLoaderConfiguration, cssLoaderConfiguration,
        addedForReactNavigation],
    },
    devServer: {
      allowedHosts: 'all',
    },
    plugins: [
      new HtmlWebpackPlugin({template: path.join(__dirname, 'index.html')}),
      // new webpack.HotModuleReplacementPlugin(),
      new webpack.DefinePlugin({__DEV__: JSON.stringify(true)}),  // See: <https://github.com/necolas/react-native-web/issues/349>
      new webpack.DefinePlugin({process: {env: {}}}),
    ],
    performance: {
      hints: false,
      maxEntrypointSize: 512000,
      maxAssetSize: 512000,
    },
    optimization: {
      minimize: true,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            compress: {
              drop_console: true,
            },
          },
        }),
      ],
      splitChunks: {
        chunks: 'all',
      },
    },
  };
};
console.log('NODE_ENV from shell:', process.env.NODE_ENV);
