# StraboField

StraboField is an application in the StraboSpot ecosystem to collect geologic data in a field setting, and is designed
to be used by geologists, geology students, and others. The application allows the collection of geologic data using a
variety of base maps - including maps, cross-sections, sketches, and images prepared by other users - referenced to
their location on the Earth. StraboSpot utilizes a controlled vocabulary developed over years of discussion in the
professional geologic community. The application uses nested spots (areas of observation) for spatial grouping of data
and tags for conceptual grouping of data. The application currently focuses on Structural Geology and Tectonics data,
but is expanding to include Petrology and Sedimentary Geology data.

The development of StraboSpot was sponsored by the United States National Science Foundation. It provides the ability to
put field data into a transparent and open framework, allowing effective cyberinfrastructure development within the
Earth Sciences. The data imported into StraboSpot is directly stored in a database that is designed to accommodate the
digital data reporting requirements of National Science Foundation grants and allows retrieval by researchers. More
explanation of StraboSpot and a desktop version with expanded tools are at https://strabospot.org.

StraboSpot uses a Neo4j graph database to give persistence to observations, photographs, or any other images imported by
the user. The system compiles the complex relationships between observations (including temporal information, such as
cross-cutting relations) and provide flexible options for access, editing, and sharing of field data.

The application will work on mobile devices with or without connection to Wi-Fi or Cellular networks. When an Internet
connection is available, users both can upload collected information and backup their device. It is available for all
devices on the Google Play and Apple App stores, and a web version of the app runs in the browser at
[strabospot.org](https://strabospot.org).

## Features

- **Spots** — capture point, line, and polygon observations, GPS-referenced from your device, drawn directly on a map,
  or placed on field images you capture.
- **Nested Spots & Tags** — group observations spatially with nested spots, and link them conceptually across areas
  with tags (geologic units, metamorphic grade, fold generations, and more).
- **Controlled vocabulary** — data entered through a shared vocabulary developed by the professional geologic
  community, covering Structural Geology and Tectonics, with Petrology and Sedimentary Geology support expanding.
- **Custom & offline maps** — bring in custom basemaps from StraboSpot My Maps or Mapbox Studio, and
  download any basemap for full offline use in the field.
- **Image basemaps & strat sections** — work over georeferenced field images and build stratigraphic column views.
- **Offline-first** — collect data with or without a network connection; upload and back up to your StraboSpot account
  when you're online, or export everything locally.
- **Cross-platform** — one app on iOS, Android, and the web.

## Tech Stack

This is a [**React Native**](https://reactnative.dev) project (iOS, Android, and web), bootstrapped using
[`@react-native-community/cli`](https://github.com/react-native-community/cli).

- **React Native 0.84** + **React 19**
- **Redux Toolkit** + **Redux Persist** for offline-first state management
- **React Navigation 7**
- **Mapbox** — [`@rnmapbox/maps`](https://github.com/rnmapbox/maps) on native, `mapbox-gl` on web
- **Turf.js** for geospatial operations, **RNFS** for the filesystem, **Sentry** for error reporting
- **Neo4j** graph database backend, accessed via REST
- **Node** >= 22.11.0, **Yarn** 4.18.0 (package manager)

## Step 1: Getting Started

- Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide
  before proceeding.

- Create a `env.json` file at project root and add the app runtime keys (this file is bundled into the app, so it must
  contain public keys only — never build-time secrets):

      {
       "mapbox_access_token": "Your Mapbox public access token",
       "orcid_client_id": "Your ORCID public client id",
       "Error_reporting_DSN": "Optional Sentry DSN or other error reporting service"
      }

- Create a `secrets.json` file at project root for build-time secrets. It is gitignored and read only by build scripts
  (`scripts/`), never bundled into the app:

      {
       "sentry_organization_auth_token": "Sentry org auth token (used by npm run setup-sentry / upload-sourcemaps)",
       "orcid_client_secret": "ORCID client secret",
       "android_keystore": "Android keystore password",
      }

- Create a `dev-test-logins.js` in project root and add:

      export const USERNAME_TEST = 'your username/email';
      export const PASSWORD_TEST = 'your password';

## Step 2: Install Packages

Install packages by running

    yarn

#### iOS

For iOS, remember to install CocoaPods dependencies (this only needs to be run on first clone or after updating native
deps).

The first time you create a new project, run the Ruby bundler to install CocoaPods itself:

    bundle install

Then, and every time you update your native dependencies, run:

    bundle exec pod install

For more information, please
visit [CocoaPods Getting Started guide](https://guides.cocoapods.org/using/getting-started.html).

## Step 3: Run

### Development

---

#### Android

    npm run android

#### iOS

    npm run ios

If everything is set up correctly, you should see your new app running in the Android Emulator, iOS Simulator, or your
connected device.

*This is one way to run your app — you can also build it directly from Android Studio or Xcode.*

#### Web

    npm run web

### Release/Production

---

#### Android

Add your Android signing information.

- Create `keystore.properties` in `/android` and add (without the quotes):

  storePassword='your store password'
  keyPassword='your key password'
  keyAlias='your key alias'
  storeFile='your store file'

- Add your Java Keystore file (.jks) to `/android/app`

Install and run a release build on a connected device or emulator:

    npm run android-release

To build for the **Google Play Store**, bundle the JS (this also strips duplicate resources — required before every
Play Store deploy) and produce the release `.aab`:

    npm run bundle:android
    npm run deploy:android

The resulting bundle is written to `android/app/build/outputs/bundle/release/`.

#### iOS

Install the CocoaPods dependencies first if you haven't (`bundle exec pod install`).

Install and run a release build on a connected device or simulator:

    npm run ios-release

To build for the **Apple App Store**, bundle the JS, then archive and upload from Xcode:

    npm run bundle:ios

Alternatively, ship a beta to TestFlight via Fastlane:

    npm run deploy-beta

#### Web

Build the production bundle (output in `/dist/`) and upload sourcemaps to Sentry:

    npm run web-deploy

Then deploy the contents of `/dist/`.

#### Versioning & release process

Bump the app version across `package.json`, Android, and iOS in one step (via Fastlane):

    npm run bump-patch    # or bump-minor / bump-major

Upload Sentry sourcemaps for a release with:

    npm run upload-sourcemaps

Official releases follow an **RC → master** flow (cut an `rc-{version}` branch, stabilize, merge to `master`, then tag
`v{version}` on master to publish the release and auto-generated changelog). Print the checklists with
`npm run start-rc` (standard) or `npm run start-hotfix` (patch directly on master). See
[RELEASE.md](RELEASE.md) for the full step-by-step process.

## Troubleshooting

If you're having issues getting the above steps to work, see
the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

## Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how to set up
  your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [GitHub](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.
