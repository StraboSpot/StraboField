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
  '@react-native-async-storage/async-storage',
  '@react-native-community/netinfo',
  '@rnmapbox/maps',
  '@sentry/react-native',
  'react-native',
  'react-native-gesture-handler',
  'react-native-image-picker',
  'react-native-reanimated',
  'react-native-tab-view',
  'react-native-vector-icons',
].map(moduleName => path.resolve(__dirname, `node_modules/${moduleName}`));

// Packages that ship ESM (lib/module has {"type":"module"}), but babel-loader transforms them
// to CommonJS. This rule overrides the module type so webpack doesn't try to evaluate the
// CommonJS output as an ES module (which would cause "exports is not defined").
const esmLibModuleTypeOverride = {
  test: /\.js$/,
  include: [
    path.resolve(__dirname, 'node_modules/@react-native-async-storage/async-storage/lib/module'),
  ],
  type: 'javascript/auto',
};

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

// @react-navigation 7 ships lib/module as strict ESM ("type": "module"), where webpack requires fully specified
// imports and will not try resolve.extensions. Its platform-split modules are deliberately imported without an
// extension (../GestureHandler, ./useLinking, ../MaskedView) so the platform resolver can pick .web.js or .native.js,
// which strict ESM cannot do. Removing this rule fails the build with 6 "Did you mean 'GestureHandler.js'?" errors.
const relaxEsmImportsForReactNavigation = {
  test: /\.m?js/,
  resolve: {
    fullySpecified: false,
  },
};

module.exports = (env, argv) => {
  const mode = argv.mode || 'development'; // dev mode by default

  console.log('Webpack Mode Variable:', mode);

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
      clean: true, // drop stale bundles from previous builds instead of leaving them alongside the new ones
    },
    mode,
    // hidden-source-map emits maps for the Sentry upload without a sourceMappingURL comment, so browsers never
    // request them. web-deploy then runs upload-sourcemaps-web, which deletes them so they are never deployed.
    devtool: mode === 'production' ? 'hidden-source-map' : false,
    ignoreWarnings: [
      {
        message: /Critical dependency: the request of a dependency is an expression/,
      },
      {
        message: /require\(\) called for module: react-native-screens but require is not available in web environment/,
      },
    ],
    resolve: {
      extensions: ['.web.js', '.js', '.web.ts', '.ts', '.web.jsx', '.jsx', '.web.tsx', '.tsx', '.css', '.json'],
      alias: {
        'react-native$': 'react-native-web',
        'react-native-screens': path.resolve(__dirname, 'src/web/stubs/react-native-screens.web.js'),
        'react-native-web': path.resolve(__dirname, 'node_modules/react-native-web'),
        '../Utilities/Platform': 'react-native-web/dist/exports/Platform',
        '@bam.tech/react-native-image-resizer': path.resolve(__dirname,
          'src/web/stubs/react-native-image-resizer.web.js'),
        '@react-native-documents/picker': path.resolve(__dirname,
          'src/web/stubs/react-native-documents-picker.web.js'),
        '@sentry/react-native': path.resolve(__dirname, 'src/web/stubs/sentry.web.js'),
        'react-native-fs': path.resolve(__dirname,
          'src/web/stubs/react-native-fs.web.js'),
        '@react-native-async-storage/async-storage': path.resolve(__dirname,
          'node_modules/@react-native-async-storage/async-storage'),
        'react-native-tab-view': path.resolve(__dirname, 'node_modules/react-native-tab-view/src/index.tsx'),
        'expo-updates': false,
      },
    },
    module: {
      rules: [esmLibModuleTypeOverride, babelLoaderConfiguration, imageLoaderConfiguration,
        ttfLoaderConfiguration, cssLoaderConfiguration, relaxEsmImportsForReactNavigation],
    },
    devServer: {
      allowedHosts: 'all',
    },
    plugins: [
      new HtmlWebpackPlugin({template: path.join(__dirname, 'index.html')}),
      new webpack.DefinePlugin({
        // react-native-web has no __DEV__ global, so define it here or cross-platform code referencing it throws.
        __DEV__: JSON.stringify(mode !== 'production'),
        process: {env: {}},
      }),
      new webpack.NormalModuleReplacementPlugin(
        /[\\/]@react-navigation[\\/]stack[\\/]lib[\\/]module[\\/]views[\\/]Screens\.js$/,
        path.resolve(__dirname, 'src/web/stubs/react-navigation-stack-screens.web.js'),
      ),
    ],
    performance: {
      hints: false,
    },
    optimization: {
      minimize: mode === 'production',
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            compress: {
              drop_console: mode === 'production',
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

