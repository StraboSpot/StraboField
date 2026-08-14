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
devices on the Google Play and Apple App stores.

This is a [**React Native**](https://reactnative.dev) project, bootstrapped using
[`@react-native-community/cli`](https://github.com/react-native-community/cli).

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
       "rockd_access_token": "Rockd access token"
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

Run app

    npm run android-release

#### Web

    npm run web-deploy

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
