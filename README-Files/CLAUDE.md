# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

StraboSpot2 is a React Native mobile/web application for collecting geologic field data, part of the StraboSpot ecosystem. It supports offline-first field data collection with synchronization to a Neo4j graph database backend. The app runs on iOS, Android, and web browsers.

## Development Commands

### Setup

```bash
# Install dependencies
yarn

# iOS: Install CocoaPods (first time only)
bundle install
bundle exec pod install

# Create required configuration files:
# 1. env.json at project root:
{
  "mapbox_access_token": "Your Mapbox public access token",
  "Error_reporting_DSN": "Optional Sentry DSN"
}

# 2. dev-test-logins.js at project root:
export const USERNAME_TEST = 'your username/email';
export const PASSWORD_TEST = 'your password';

# 3. Generate Sentry properties files (auto-generated from env.json):
npm run setup-sentry
```

### Running the App

```bash
# Development
npm run android          # Run on Android
npm run ios              # Run on iOS
npm run ios-sim          # Run on iPad Pro simulator
npm run web              # Run web version (dev mode)

# Production/Release
npm run android-release  # Run Android in release mode
npm run ios-release      # Run iOS in release mode
npm run web-deploy       # Build web for production
```

### Building & Bundling

```bash
# Bundle JavaScript for platforms (required before deploying to stores)
npm run bundle:ios       # Bundle for iOS
npm run bundle:android   # Bundle for Android (must run before PlayStore deploy)

# Deploy
npm run deploy:android   # Creates .aab file in app/build/outputs/bundle/release
```

### Testing & Linting

```bash
npm test                 # Run Jest tests
npm run lint             # Run ESLint
npm run lint:fix         # Auto-fix ESLint issues
```

### Versioning & Deployment

```bash
# Version bumping (updates package.json, iOS/Android versions, creates changelog)
npm run bump-patch       # x.x.X
npm run bump-minor       # x.X.0
npm run bump-major       # X.0.0

# After bumping, commit and push
npm run commit-and-push  # Commits version bump and pushes to master

# Deploy beta builds via Fastlane
npm run deploy-beta
```

### Other Commands

```bash
npm start                # Start Metro bundler
npm run debug            # Start Metro with experimental debugger
npm run remove:packages  # Clean node_modules and iOS Pods
```

## Architecture Overview

### Feature-Based Module Structure

The codebase is organized into **39 self-contained feature modules** under `/src/modules/`, each containing:
- UI components
- Redux slice for state management
- Custom hooks for business logic
- Constants and utilities
- Platform-specific overrides (`.web.js` files)

Key modules include:
- **maps/** - Mapping (basemaps, offline maps, drawing)
- **spots/** - Observation/spot management (core data model)
- **compass/** - Device sensor integration for measurements
- **project/** - Project and dataset management
- **images/** - Image capture and management
- **form/** - Dynamic form rendering engine
- **notebook-panel/** - Main data entry interface
- **three-d-structures/**, **sed/**, **petrology/** - Geology-specific features

### State Management (Redux Toolkit)

**10 main Redux slices** manage application state:
- `home.slice.js` - UI state, modals, loading indicators
- `spots.slice.js` - Spot (observation) data
- `projects.slice.js` - Projects, datasets, templates, tags (largest slice)
- `maps.slice.js` - Map state, basemaps, symbols
- `offlineMaps.slice.js` - Offline tile management
- `userProfile.slice.js` - Authentication and user data
- `compass.slice.js` - Compass measurements
- `notebook.slice.js` - Notebook navigation state
- `mainMenuPanel.slice.js` - Menu visibility
- `connections.slice.js` - Network connectivity

**Redux Persist** with AsyncStorage provides local persistence with selective slice persistence (blacklist/whitelist configurations).

### Navigation (React Navigation v7)

Two main navigation stacks:
- **AuthStack** - Sign-in/Sign-up screens (shown when `!isAuthenticated`)
- **AppStack** - Main app screens (HomeScreen, ImageSlider, Documentation)

Navigation logic in `/src/routes/Routes.js` with deep linking support (`strabofield://` scheme).

### Custom Hooks Pattern

60+ custom hooks encapsulate business logic, following the pattern `use[Feature].js`:
- `useProject.js`, `useSpots.js`, `useTags.js` - Data management
- `useServerRequests.js` - API calls
- `useUpload.js`, `useDownload.js` - Data sync
- `useDevice.js` - File system operations (RNFS)
- `useCompass.js` - Sensor integration
- `usePermissions.js` - Device permissions

Hooks keep components presentational and logic reusable.

### Platform-Specific Code

**Web overrides** use `.web.js` suffix (41 files):
- `Map.web.js` - Uses MapboxGL for web vs RNMapbox for mobile
- `useDevice.web.js` - Stubs for web (no file system)
- Various component adaptations for browser environment

**Build configuration:**
- `webpack.config.js` - Web bundling with React Native Web aliasing
- `metro.config.js` - React Native Metro bundler
- Entry points: `index.js` (mobile), `index.web.js` (web)

### Data Architecture

**Local Storage:**
- Redux Persist for app state
- File system (RNFS) for structured data:
  - Projects in device backup directory
  - Images in dedicated directory
  - Offline map tiles cached locally
  - Directory structure managed by `directories.constants.js`

**Data Model:**
- **Projects** contain datasets, templates, tags, reports
- **Datasets** are collections of spots with feature types
- **Spots** are observations with:
  - Geometry (Point, LineString, Polygon, GeometryCollection)
  - Properties (measurements, images, notes, samples)
  - Modified timestamps for sync
  - Nested relationships (parent-child hierarchy)

**Server Sync:**
- Neo4j graph database backend (via REST API)
- Offline-first: works without network, syncs when available
- Upload/download via `useServerRequests.js`
- Modified timestamps track changes

### Dynamic Form System

**JSON-based form definitions** in `/src/assets/forms/` (74 forms):
- XLSForm-style structure: `survey` (field definitions) + `choices` (options)
- 14 form categories (measurement, petrology, sedimentology, 3d_structures, etc.)
- Features:
  - Skip logic with JavaScript conversion
  - Validation with constraints
  - Required field handling
  - Label dictionary for display names
  - Supports complex nested structures

Form rendering in `/src/modules/form/` with custom field components.

### Services Layer

Key services in `/src/services/`:
- **useDevice.js** - File operations, storage management
- **useServerRequests.js** - API calls to StraboSpot server
- **useUpload.js** / **useDownload.js** - Data synchronization
- **useExport.js** / **useImport.js** - Data import/export
- **useCompass.js** - Compass and sensor integration
- **ConnectionStatus.js** - Network monitoring

### Shared Code

**Utilities** (`/src/shared/Helpers.js`):
- `isEmpty()`, `isEqual()`, `deepObjectExtend()` - Object utilities
- `getNewId()`, `getNewUUID()` - ID generation
- `validate()` - Form validation
- Geographic helpers, date/time conversions, CSV parsing

**UI Components** (`/src/shared/ui/`):
- Buttons: AddButton, DeleteButton, SaveAndCancelButtons
- Modals, alerts, toasts
- Form inputs, lists, dividers
- Custom: SliderBar, TruncatedText, Loading

**Assets** (`/src/assets/`):
- `/forms/` - JSON form definitions
- `/icons/` - UI icons
- `/lottie-animations/` - Animations

## Code Style

### ESLint Configuration (`.eslintrc.js`)

**Key rules enforced:**
- Single quotes for strings and JSX
- Stroustrup brace style (else/catch on new line)
- Import sorting: React/React Native first, then external, then internal, alphabetically
- JSX props must be sorted alphabetically
- StyleSheets must be sorted alphabetically
- No unused variables (except function args)

**Auto-fix:** Run `npm run lint:fix` before committing.

### File Naming Conventions

- Components: PascalCase (e.g., `SpotsList.js`)
- Hooks: camelCase with `use` prefix (e.g., `useProject.js`)
- Redux slices: camelCase with `.slice.js` suffix (e.g., `spots.slice.js`)
- Constants: camelCase with `.constants.js` suffix
- Styles: camelCase with `.styles.js` suffix
- Platform overrides: `.web.js` suffix for web-specific code

### Component Organization

Module structure:
```
/src/modules/[feature]/
├── [Feature].js              # Main component
├── [Feature]List.js          # List view
├── [Feature]Detail.js        # Detail view
├── use[Feature].js           # Custom hook
├── [feature].slice.js        # Redux slice
├── [feature].constants.js    # Constants
├── [Feature].styles.js       # Styles
└── [Component].web.js        # Web overrides
```

## Important Implementation Details

### Adding New Form Fields

1. Add field definition to appropriate form JSON in `/src/assets/forms/`
2. Update form rendering logic in `/src/modules/form/` if custom component needed
3. Add validation rules if required
4. Update Redux slice if new state needed

### Working with Spots (Observations)

Spots are the core data model. Key functions in `useSpots.js`:
- `createSpot()` - Create new spot
- `editSpot()` - Modify existing spot
- `deleteSpot()` - Remove spot
- `setSelectedSpot()` - Set active spot for editing

Spots have a nested hierarchy via `properties.nesting` relationships.

### Map Interactions

Three map types:
1. **Regular maps** - Standard basemaps with spot overlay
2. **Image basemaps** - Custom georeferenced images
3. **Strat sections** - Stratigraphic column display

Map state managed in `maps.slice.js`. Platform-specific implementations:
- Mobile: `@rnmapbox/maps` (native Mapbox SDK)
- Web: `mapbox-gl` + `react-map-gl`

### Offline Support

Offline functionality via:
- Redux Persist for app state
- Local file storage via RNFS (mobile) or IndexedDB (web)
- Offline map tiles cached locally
- Modified timestamps track sync status

Always check network state before server operations using `ConnectionStatus`.

### Error Tracking

Sentry integration for error reporting:
- Configure DSN in `env.json`
- Errors automatically captured
- Sourcemaps uploaded via `npm run upload-sourcemaps`

### Android Release Builds

**Critical:** Must run `npm run bundle:android` before every PlayStore deployment. This command bundles JavaScript and removes duplicate resources.

### Version Bumping

Use npm scripts for version management:
1. `npm run bump-[patch|minor|major]` - Updates all version files + creates changelog
2. `npm run commit-and-push` - Commits changes and pushes to master
3. `npm run deploy-beta` - Deploys via Fastlane (requires Fastlane setup)

Version is tracked in:
- `package.json`
- `android/app/build.gradle` (versionCode, versionName)
- `ios/StraboSpot2/Info.plist` (CFBundleVersion, CFBundleShortVersionString)

## Testing

Minimal test coverage currently. Tests in `__tests__/`:
- Basic App rendering test exists
- Jest configured with React Native preset
- Run with `npm test`

## Dependencies

**Key dependencies:**
- React 19.0.0 + React Native 0.79.1
- Redux Toolkit 2.7.0 + Redux Persist 6.0.0
- React Navigation 7.x
- Mapbox Maps (@rnmapbox/maps 10.x for native, mapbox-gl 2.x for web)
- Formik 2.4.6 - Form management
- Turf.js 7.x - Geospatial calculations
- RNFS - File system access
- Sentry - Error tracking

**Node version:** >=18 (specified in `package.json`)

**Package manager:** Yarn 4.9.4

## Deployment Checklist

### Android
1. Create `keystore.properties` in `/android/` with signing credentials
2. Add `.jks` keystore file to `/android/app/`
3. Run `npm run bundle:android` (required - removes duplicate resources)
4. Run `npm run deploy:android` to create `.aab`
5. Upload `.aab` from `android/app/build/outputs/bundle/release/` to PlayStore

### iOS
1. Ensure CocoaPods dependencies installed: `bundle exec pod install`
2. Run `npm run bundle:ios` to bundle JavaScript
3. Open Xcode, configure signing
4. Archive and upload via Xcode or `npm run deploy-beta` (Fastlane)

### Web
1. Run `npm run web-deploy` to create production build
2. Deploy `/dist/` directory contents to web server

## Common Patterns

### Accessing Redux State
```javascript
import {useSelector} from 'react-redux';

const spots = useSelector(state => state.spot.spots);
const selectedSpot = useSelector(state => state.spot.selectedSpot);
```

### Dispatching Actions
```javascript
import {useDispatch} from 'react-redux';
import {setSelectedSpot} from '../modules/spots/spots.slice';

const dispatch = useDispatch();
dispatch(setSelectedSpot(spot));
```

### Using Custom Hooks
```javascript
import useSpots from '../modules/spots/useSpots';

const MyComponent = () => {
  const {createSpot, editSpot, deleteSpot} = useSpots();
  // Use hook methods
};
```

### Platform-Specific Code
```javascript
import {Platform} from 'react-native';

if (Platform.OS === 'ios') {
  // iOS-specific code
} else if (Platform.OS === 'android') {
  // Android-specific code
} else if (Platform.OS === 'web') {
  // Web-specific code
}
```

Or create `.web.js` files for complete component overrides.

### File Operations
```javascript
import useDevice from '../services/useDevice';

const MyComponent = () => {
  const {readDirectoryForData, writeDataToDevice} = useDevice();
  // Use device methods for file I/O
};
```
