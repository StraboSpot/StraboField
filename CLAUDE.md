# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Working Style

- **Ask before assuming.** If a request has multiple interpretations, surface them — don't pick silently. If something's
  unclear, stop and name it. (Skip this for trivial edits — use judgment.)
- **Simplest thing that works.** No speculative abstractions, config, or error handling for impossible cases. If it's
  200 lines and could be 50, rewrite it.
- **Match existing style.** New code should read like the code around it.
- **Verify, don't hope.** For bugs/features, prefer writing a test that reproduces/defines success, then making it pass.
  State a brief plan for multi-step work.

## Critical / Non-obvious (read first)

- **Android `compileSdkVersion` must be 36** — `react-native-screens` pulls in `androidx.core:core-ktx:1.17.0` which
  requires SDK 36. Set in `android/app/build.gradle`.
- **Run `npm run bundle:android` before every PlayStore deploy** — it bundles JS and removes duplicate resources;
  skipping it breaks the build.
- **`@rnmapbox/maps` bridgeless patch** — requires `RCTBridge!` → `RCTBridge?` with a URLSession fallback in
  `RNMBXImageQueue`, applied via `patches/@rnmapbox+maps+10.3.1.patch`. Rename the patch when upgrading Mapbox.
- **Releases: tag on `master` after merge, with a `v` prefix** (e.g. `v2.29.1`) — never tag on the rc branch, never
  hand-write the changelog. See [Release Process](#release-process-rc--master).
- **Package manager is Yarn 4.13.0** (install with `yarn`); npm-script names below run fine via `npm run` or `yarn`.
- **CLAUDE.md is auto-edited on commit** by `scripts/update-claude-md.js` (module count + dep versions). Keep the anchor
  lines it matches intact — see the Architecture/Dependencies sections.

## Gotchas / Lessons Learned

<!-- Append-only. Each entry: symptom → cause → fix. Newest at top. -->

- **Sketch canvas: compressed basemap / stray pinch marks / dead Android zoom / Android strokes dying mid-gesture**
  → `@StraboSpot/react-native-sketch-canvas` exports the full canvas (aspect mismatch with the image basemap's stored
  width/height), and its `PanResponder` draws in screen-space translation-only coords, ignores multi-touch, and takes a
  single hard-coded stance on native gestures. No one stance suits both consumers: `Sketch.js` must let them through
  for its pinch/pan, while `FreehandSketch` must block them or Mapbox seizes one-finger strokes off the canvas →
  `Sketch.js` sizes the canvas to the image aspect + saves with `cropToImageSize: true`; the rest is
  `patches/@StraboSpot+react-native-sketch-canvas+0.8.0.patch` (transform-aware `locationX/locationY`, a
  `touches.length > 1` draw guard, and `onShouldBlockNativeResponder` behind a `shouldBlockNativeResponder` prop
  defaulting to true, which `Sketch.js` alone passes false).
  JS-only — no native rebuild. **Rename the patch on any version bump** or patch-package skips it.
- **iPad form modals slide off-screen** → rn-vui Overlay's KeyboardAvoidingView pushes them → set `doesRenderAsView` +
  Form `renderInline`.
- **Second modal never appears on iOS** → a Modal presented while another dismisses gets dropped → chain via
  ModalWrapper's `onDismiss`.
- **Toasts shown from inside a modal are hidden or dimmed** → they mount and animate, they're just painted
  underneath. How far depends on placement: a center-placed toast (the `ToastWrapper` default) sits behind the modal
  body and is fully hidden, while a bottom-placed one falls outside a large-screen web modal's centered box and
  shows through the 50%-opacity backdrop. A `SMALL_SCREEN` modal is fullscreen, so it covers everything. On
  web, every react-native-web `View` carries `position: relative; z-index: 0`, so each one is a stacking context and
  the ToastProvider's `z-index: 999999` can't escape the app root — meanwhile RNW's `Modal` portals into a `<div>`
  appended to `document.body`, landing as a later sibling. On native it's not a layering problem at all: an RN
  `Modal` is its own window (UIViewController / Dialog), so nothing in the main tree can ever paint above it, and
  only `doesRenderAsView` modals let toasts through. → **Report results in place instead.** Web save outcomes are
  published to Redux as `connections.projectSaveStatus` for exactly this reason — see `updateProjectListener` in
  `listenerMiddleware.web.js` and the import modals that consume it. Never mount a second ToastProvider inside a
  modal: `GlobalToast` is a module-level `let` overwritten by the last provider to mount, with no unmount cleanup,
  so it breaks `Toast.show` app-wide afterwards.

## Development Commands

```bash
# Setup
yarn                       # install deps
bundle install && bundle exec pod install   # iOS CocoaPods (first time)
npm run setup-sentry       # generate Sentry props from secrets.json
node scripts/install-hooks.js   # install git hooks (CLAUDE.md auto-update)

# Run
npm run ios | android | web            # dev
npm run ios-sim                        # iPad Pro simulator
npm run ios-release | android-release  # release mode
npm run web-deploy                     # production web build

# Bundle (required before store deploys)
npm run bundle:ios
npm run bundle:android     # also strips duplicate resources
npm run deploy:android     # creates .aab

# Test / lint
npm test
npm run lint
npm run lint:fix           # run before committing

# Version bump (package.json + iOS/Android via Fastlane)
npm run bump-patch | bump-minor | bump-major
npm run commit-and-push    # commits bump, stamps version, pushes to master
npm run deploy-beta        # Fastlane beta

# Misc
npm start                  # Metro
npm run remove:packages    # clean node_modules + iOS Pods
```

**Required config files** (project root, gitignored):

- `env.json` — app **runtime** keys, bundled into the app so **public keys only**:
  `{"mapbox_access_token": "...", "orcid_client_id": "...", "Error_reporting_DSN": "..."}`. Anything imported under
  `src/` gets inlined into the web/Metro bundles, so never put secrets here.
- `secrets.json` — **build-time** secrets, read only by `scripts/` (never imported under `src/`, so never bundled):
  `sentry_organization_auth_token`, `orcid_client_secret`, `android_keystore`, `rockd_access_token`.
- `dev-test-logins.js` — `export const USERNAME_TEST / PASSWORD_TEST`

**Two helper scripts to know:**

- `scripts/organize-file.js src/modules/[feature]/[File].js` — reorders a component/hook into canonical section order.
  Reset with `git checkout src/`; always verify output for use-before-declaration errors.

## Domain Glossary

- **Spot** — a single field observation (the core record); not a map pin.
- **Dataset** — a collection of spots within a project.
- **Strat section** — stratigraphic column view, one of three map types.
- **Nesting** — parent/child spot hierarchy via `properties.nesting`.
- **Feature type** — the category/schema a spot's measurements follow.
- **Tag** — cross-cutting label linking spots (lives in projects.slice).

## Why It's Built This Way

- **Offline-first** — geologists work with no signal; local writes are the source of truth, server sync is best-effort.
  Never assume network.
- **`.web.js` overrides over `Platform.OS`** for anything touching native modules (file system, Mapbox, compass) — web
  has no equivalent, so full-file swaps are cleaner than branches.
- **Neo4j backend** — the data model is a graph (nested spots, tags, relationships); it's not a REST-CRUD app.

## Release Process (RC → Master)

**Remind the user of these steps whenever they mention versioning, the rc branch, or releasing.**

1. **Start RC:** cut `rc-{version}` from `dev` → bump version → push. A GitHub Action auto-creates a **draft release**.
2. **Stabilize:** bug fixes land directly on `rc-{version}`; each push auto-updates the draft. No manual changelog.
3. **Cut it:** when the version is finalized, `npm run cut-rc` tags `v{version}-rc` and **freezes that version's draft** —
   commits after it collect into the next version's draft. This marker (not the `package.json` version) is what the draft
   workflow slices on, so merging `master` (the 2.29.x hotfix line) into the rc branch no longer scrambles the boundary.
4. **Publish:** merge `rc-{version}` → `master` and push → `git tag v{version}` on master →
   `git push origin v{version}`. The Action publishes the official release + changelog.

Common mistakes: tagging on rc instead of master; missing the `v` prefix; hand-writing the changelog; forgetting
`npm run cut-rc` when a version is done, so its draft keeps absorbing the next version's commits.

The changelog is generated by `.github/workflows/changelog.yml`, which triggers on the `v*` tag (not the master push)
and diffs against the immediately preceding version tag in `sort -V` order — so any changelog-affecting fix must be on
`master` **before** you tag. Notes publish to the GitHub Release page only (no `CHANGELOG.md` is committed; `master` is
protected). Write meaningful `feat(...)`/`fix(...)` commit subjects — they become the changelog verbatim.

**For the full step-by-step checklists — including the hotfix path (patching a version directly on `master` without an
rc merge) — see [RELEASE.md](RELEASE.md)**, or print them with `npm run start-rc` / `npm run start-hotfix`.

## Architecture

**React Native app (iOS/Android/web)** for offline-first geologic field data collection, syncing to a Neo4j graph
backend via REST. Entry points: `index.js` (mobile), `index.web.js` (web). Web bundles via `webpack.config.js`; mobile
via `metro.config.js`.

- **Feature modules** — **42 self-contained feature modules** under `/src/modules/`, each with UI components, a
  `.slice.js` Redux slice, `use[Feature].js` hooks, constants, and `.web.js` platform overrides. Core: `spots/` (the
  central data model), `maps/`, `compass/`, `project/`, `form/` (dynamic form engine), `notebook-panel/`.
- **State** — Redux Toolkit, 10 slices (`spots`, `projects` (largest), `maps`, `offlineMaps`, `userProfile`, `compass`,
  `notebook`, `home`, `mainMenuPanel`, `connections`). Redux Persist + AsyncStorage with selective blacklist/whitelist
  persistence.
- **Navigation** — React Navigation v7 in `/src/routes/Routes.js`: `AuthStack` when `!isAuthenticated`, else `AppStack`.
  Deep linking via `strabofield://`.
- **Services** (`/src/services/`) — `device/` (useDevice, useCompass, usePermissions, CompassModule), `files/` (
  useUpload/useDownload/useExport/useImport, directories.constants.js), `network/` (useServerRequests, serverAPI,
  urls.constants.js).
- **Shared** — `/src/shared/helpers.js` (isEmpty, isEqual, deepObjectExtend, getNewUUID, validate, geo/date/CSV helpers)
  and `/src/shared/ui/` (buttons, modals, alerts, toasts, form inputs).
- **Platform code** — prefer `.web.js` file overrides for full component swaps; use `Platform.OS` for small branches.

**Data model:** Projects → datasets → spots. A **spot** = geometry (Point/LineString/Polygon/GeometryCollection) +
properties (measurements, images, notes, samples) + modified timestamp, with a parent-child hierarchy via
`properties.nesting`. Spot CRUD lives in `useSpots.js` (`createSpot`, `editSpot`, `deleteSpot`, `setSelectedSpot`).

**Dynamic forms:** XLSForm-style JSON in `/src/assets/forms/` (`survey` + `choices`), 14 categories, with skip logic,
constraint validation, and a label dictionary. Rendered by `/src/modules/form/`. To add a field: edit the form JSON, add
a custom component in `form/` if needed, wire validation and slice state. Every form is set up through
`form/FormikWrapper.js` — the only place `<Formik>` is used — which derives the survey validation from a `formName`
prop; passing it `setIsFormInvalid` also validates as the user types so Save can be disabled while errors remain.
`useForm().validateForm` returns `{errors, values}` — the values being what to save (trimmed, numbers converted from
text, empty and irrelevant fields dropped). It writes nothing back, and no validate anywhere may modify the values it
is given: forms are validated as they are typed in, so a rewritten value lands under the cursor.

**Maps:** three types — regular basemaps, georeferenced image basemaps, strat sections. State in `maps.slice.js`. Native
uses `@rnmapbox/maps`; web uses `mapbox-gl` + `react-map-gl`.

**Offline & sync:** Redux Persist + RNFS (mobile) / IndexedDB (web) + locally cached map tiles; modified timestamps
track sync state. Check network via `ConnectionStatus` before any server call.

## Code Style

ESLint (`.eslintrc.js`) enforces: single quotes; Stroustrup braces (else/catch on new line); import order (React/RN →
external → internal, alphabetical); alphabetized JSX props and StyleSheet keys; no unused vars (except function args).
Run `npm run lint:fix` before committing.

**Naming:** Components PascalCase; hooks `use`-prefixed camelCase; `*.slice.js`, `*.constants.js`, `*.styles.js`
suffixes; `.web.js` for web overrides.

## Dependencies

- React 19.2.3 + React Native 0.84.1
- Redux Toolkit 2.12.0 + Redux Persist 6.0.0
- React Navigation 7.x
- Mapbox Maps (@rnmapbox/maps 10.3.1 for native, mapbox-gl 2.x for web)
- Formik 2.4.9 - Form management
- Turf.js 7.x, RNFS, Sentry

**Node version:** >=22.11.0. **Package manager:** Yarn 4.18.0

## Deployment Checklist

**Android** — 1) `keystore.properties` in `/android/` + `.jks` in `/android/app/`; 2) `npm run bundle:android`; 3)
`npm run deploy:android`; 4) verify the AAB dropped the 16 KB-flagged SQLite lib —
`unzip -l android/app/build/outputs/bundle/release/app-release.aab | grep -i libsqliteJni` should print **nothing**
(it ships a prebuilt NDK r20 `.so`; excluded in `android/app/build.gradle` via `configurations.all`, since async-storage
uses the framework SQLite driver — bumping NDK/androidx.sqlite does *not* fix it); 5) upload `.aab` from
`android/app/build/outputs/bundle/release/`.

**iOS** — 1) `bundle exec pod install`; 2) `npm run bundle:ios`; 3) Xcode signing → archive/upload, or
`npm run deploy-beta`.

**Web** — `npm run web-deploy`, then deploy `/dist/` contents.

Version lives in `package.json`, `android/app/build.gradle`, and `ios/StraboSpot2/Info.plist`. Sentry: DSN in
`env.json`, sourcemaps via `npm run upload-sourcemaps`.

## Testing

Minimal coverage. Jest + React Native preset; basic App render test in `__tests__/`. Run `npm test`.

## References

<!-- Fill in URLs so Claude can be told to fetch them instead of guessing. -->

- StraboSpot server API list: https://strabospot.org/api
- Data model / schema reference: <TODO>
- Issue tracker: https://github.com/StraboSpot/StraboField/issues
