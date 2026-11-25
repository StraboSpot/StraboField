# Over-the-air (OTA) updates

StraboField can get JavaScript-only fixes without a store release. The app checks the StraboSpot update server
(`https://strabospot.org/ota/manifest`) for a newer bundle, downloads it in the background and offers the user a
restart. Anything that touches native code (`ios/`, `android/`, native libraries, `patches/`) still needs a store
release.

## How it works

- **When the app checks:** at every cold start, and when it comes back to the foreground if at least 30 minutes
  have passed since the last check (`FOREGROUND_CHECK_INTERVAL_MS` in
  `src/modules/updates/UpdatePromptListener.js`).
- **What the user sees:** once an update has downloaded, an "Update Ready" alert offers **Later** or **Restart**.
  Before the alert shows, the open project is backed up to the device if it has changed since its last backup, and the
  alert says it was (or that the backup failed). Restart saves the Redux store and reloads into the new version. Later
  doesn't ask again about that update for the rest of the session, and the next cold start opens straight into it. The
  prompt waits while a Spot is being drawn or edited on the map, and appears once that edit is saved or canceled. A
  newer update published later in the session gets its own prompt. The same prompt appears whether the check came from
  a cold start or from returning to the app.
- **Offline:** a failed check is silent and is retried next time.
- **Runtime version:** each build has a runtime version, a fingerprint of its native code. An update only reaches
  builds whose runtime version matches the one it was published for. `npm run ota:publish` works it out for you.
  `fingerprint.config.js` leaves out files that change without the native code changing: package.json's `scripts`,
  the JS bundles from `npm run bundle:*`, IDE state (`.idea/`, `xcuserdata/`, schemes) and machine-specific files.
  Before that, running `bundle:android` or having Android Studio open gave an Android build a runtime version no
  update was published for. `android/app/build.gradle` also forces expo-updates' fingerprint task to rerun on every
  build; Gradle otherwise kept the first fingerprint it wrote. If a phone gets no updates, compare the runtime
  version it reports in `npm run ota -- stats` with the one the update was published for. On Android, the APK's
  value is in `android/app/build/generated/assets/createReleaseUpdatesResources/fingerprint`.
- **Code signing:** the app only accepts updates signed with our private key. The matching public certificate is
  `certs/certificate.pem`, and it is built into the app (`ios/StraboSpot2/Expo.plist` and
  `android/app/src/main/AndroidManifest.xml`). Signing happens on your computer when you publish. The server only
  holds the certificate and refuses anything with a signature that doesn't verify.
- **Channels:** a build that sends no channel header gets `production`, which is what the committed config does,
  so store, TestFlight and Play testing builds are all on `production`. A build that sends the header
  `expo-channel-name: beta` gets the `beta` channel.

> **For a beta-channel test build,** add the header locally and don't commit it:
> `EXUpdatesRequestHeaders` → `{expo-channel-name: beta}` in `Expo.plist`,
> `expo.modules.updates.UPDATES_CONFIGURATION_REQUEST_HEADERS_KEY` → `{"expo-channel-name":"beta"}` in
> `AndroidManifest.xml`, and `updates.requestHeaders` in `app.json`. The header changes the runtime version, so
> publish beta updates from that same checkout. Never ship a store build with it, or every user is put on beta.

## One-time setup

1. **Private key:** `~/.strabofield/ota-signing-keys/private-key.pem`, readable only by you (`chmod 600`). Keep a
   copy in 1Password and **never share it**, including with the server admin. To use a key stored somewhere else,
   set `OTA_KEY` to its path.
2. **Publish token:** add it to `secrets.json` in the project root, which git ignores:
   ```json
   "ota_publish_token": "<the token>"
   ```
   An `OTA_TOKEN` environment variable overrides it. Keep a copy of the token in 1Password too.
3. **Node 18 or newer.** The project already requires a newer version.

## Publishing an update

```bash
npm run ota:publish -- --channel beta --message "What changed"
```

| Option | Meaning |
|---|---|
| `--channel` | **Required.** `beta` for test builds, `production` for store builds. |
| `--message` | **Required.** Shown in `npm run ota -- list`. |
| `--platform ios` / `--platform android` | Publish to one platform only. Both by default. |
| `--dry-run` | Show what would be uploaded and published without changing anything on the server. |

The command:

1. Warns if files the runtime version depends on have uncommitted changes. The update will then only reach a build
   made with those exact changes.
2. Works out the iOS and Android runtime versions.
3. Exports the bundle to `dist-ota/`. This is not `dist/`, which is the web build.
4. Signs each platform's update with the private key and uploads it. Only files the server doesn't already have are
   sent, so a small fix after a big release uploads little more than the new bundle.
5. Prints an `npm run ota:check` command to confirm the result.

**Publish after the build it's meant for.** A phone only moves to updates dated after its own build. If a store
build is made after an update was published, that build ignores the update. Republishing the update fixes this
(see [Undoing a bad update](#undoing-a-bad-update)).

### Testing a new setup

1. Make a native build on a test phone from the current code. The update URL, certificate and channel are built
   into the app, so changes to them only take effect in a new build.
2. Change something small in the JavaScript.
3. Run `npm run ota:publish -- --channel beta --message "Test" --dry-run`, then again without `--dry-run`.
4. Run the `npm run ota:check` command it prints.
5. Reopen the app on the phone. The prompt appears within a few seconds of a cold start, or after returning to the
   app 30 minutes or more after the last check.

## Checking a publish without a phone

```bash
npm run ota:check -- --platform ios --runtime <runtime version> --channel beta
```

This asks the server for an update the same way the app does. It checks the signature against
`certs/certificate.pem` and downloads every file to compare its hash. `ALL OK` means a phone on that build would
accept the update. A 204 response means there's no update for that build. That's also a pass, since it's a valid
answer. Add `--no-download` to skip downloading the files.

## Update history

```bash
npm run ota -- list
```

Each release is one tab-separated line:

| Column | Example |
|---|---|
| Release ID (used by `show`, `withdraw`, `restore` and `republish`) | `r_1234` |
| Platform | `ios` |
| Channel | `beta` |
| Kind: a normal update, or a rollback to the store bundle | `update` / `rollBackToEmbedded` |
| Update ID (the one phones report) | `7f3c…` |
| Published | `2026-11-19T15:02:11Z` |
| Size | `297 files 12583301 B` |
| Status | `live` / `WITHDRAWN <date>` |
| Runtime version | `b4ab9e5b…` |
| Message | `Fix strike/dip rounding` |

Narrow it down with `--channel`, `--platform`, `--runtime <version>` and `--limit <n>`:

```bash
npm run ota -- list --channel production --platform ios --limit 10
```

To see one release in full, including the exact signed manifest:

```bash
npm run ota -- show <releaseId>
```

## Usage stats

```bash
npm run ota -- stats --days 30
```

This shows:

- How many installs are on each runtime version, per platform and channel. This tells you which builds are still
  in use.
- Which update each group is running.
- Any crash reports a phone sent after an update failed and it rolled back.

Installs are counted by an anonymous ID that the server stores only in hashed form.

## Undoing a bad update

**Withdrawing alone doesn't remove the update from phones that already downloaded it.** It only stops the server
offering it to anyone else. To move phones off it, do one of the following after withdrawing:

```bash
# 1. Stop offering the bad release
npm run ota -- withdraw <badReleaseId> --note "why"

# 2a. Re-send the last good release with a new ID and today's date, so phones take it as newest
npm run ota -- republish <goodReleaseId> --key ~/.strabofield/ota-signing-keys/private-key.pem

# 2b. Or send every phone on that build back to the bundle inside the store build
npm run ota -- rollback-to-embedded --platform ios --runtime <runtime version> --channel production \
  --key ~/.strabofield/ota-signing-keys/private-key.pem
```

`rollback-to-embedded` takes one platform at a time, so run it for `android` too if needed. To offer a withdrawn
release again, run `npm run ota -- restore <releaseId>`.

If an update crashes on launch, the app goes back to its previous working bundle by itself and reports the error,
which then appears in `stats`.

## What the server refuses

A publish is rejected if:

- its signature doesn't verify,
- an asset URL doesn't point to strabospot.org,
- a file is missing or doesn't match its hash,
- the runtime version doesn't match,
- or it's dated older than the newest update already on that channel.

## Files

| File | Purpose |
|---|---|
| `publish.js` | `npm run ota:publish`: export, work out runtime versions, sign and upload |
| `ota.js` | `npm run ota`: runs `ota-publish.mjs` with the token from `secrets.json` |
| `token.js` | Finds the publish token (`OTA_TOKEN`, else `secrets.json`) |
| `ota-publish.mjs` | From the server side. Talks to the server's publish API. Kept as delivered and excluded from lint. |
| `ota-client-check.mjs` | From the server side. `npm run ota:check`. Kept as delivered and excluded from lint. |

The server's specification is `docs/ota-update-server.html`.
