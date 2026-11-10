# End-to-end tests (Maestro)

Black-box UI tests that drive a built StraboField app on an iOS simulator (or Android emulator).
The first suite targets **data loss**: data a geologist entered must survive the app being killed.

All flows run as **Guest**, so they never touch the StraboSpot server or a real account.

## Tests

| Flow | Checks |
|---|---|
| `data-loss/01` | A Spot and its note survive a force-quit; dataset count stays 1 |
| `data-loss/02` | A note survives the app being killed the instant Save is tapped |
| `data-loss/03` | Five Spots created in a row all survive a force-quit |
| `data-loss/04` | An edited note keeps the new text after a force-quit (no revert) |
| `data-loss/05` | Typing a note, leaving the page, answering "Unsaved Changes" with **Yes** keeps it |
| `data-loss/06` | Same, answering **No**, discards only the note; the Spot is kept |
| `data-loss/07` | Backup > Save, then add a Spot and edit the note; restoring the backup brings back exactly the backed-up Spot and note |
| `data-loss/08` | Opening a saved backup asks first; "Go to Backup Page" leaves the current (newer) project untouched |
| `data-loss/09` | Backup > Save & Zip, then empty the project and delete the saved folder; importing the zip through the iOS file picker and opening it restores the Spot and note |
| `data-loss/10` | A saved backup is still listed and restorable after a force-quit |

Backups land in the app's `Documents/ProjectBackups/<name>/`; Save & Zip also writes
`Documents/Distribution/<name>.zip` (On My iPhone > StraboField > Distribution in the Files app).
After a restore no target dataset is selected, so the map's draw buttons stay hidden until one is starred.

### Server tests (`server/`, signed in)

| Flow | Checks |
|---|---|
| `server/01` | Upload a project, replace the local copy with an empty one, download it: the Spot and its note come back |
| `server/02` | After new local work that wasn't uploaded, downloading the server copy shows the "NOT NEWER than the current project" warning, and "Go to Backup Page" keeps the local Spots |

These talk to the **live StraboSpot server** with whatever account is signed in on the simulator:

- **Sign in by hand once** on the test simulator. The flows keep app state (no `clearState`), so the session
  carries over; the password is never stored in the repo or typed by a flow.
- **Run them on their own**: `maestro --device "<UDID>" test .maestro/server/`. The offline flows clear app
  state, which signs the simulator out, so run those on a different simulator.
- **Each run leaves projects on the server**, named `E2E-<MMDDhhmm>-rt` / `E2E-<MMDDhhmm>-gd` (UTC). Delete
  them from the account now and then. Locally they also replace the open project on that simulator.

Shared steps live in `subflows/`: starting a guest or signed-in project, adding a point Spot or note,
force-quit, checking the dataset count, closing side panels, saving/restoring/deleting a device backup,
importing a zip, uploading, and opening a server project.

## Running

```bash
brew tap mobile-dev-inc/tap && brew install mobile-dev-inc/tap/maestro   # once
```

1. Build the app for the simulator **with the JS bundled in** (Release), or use a Debug build with Metro running.
2. Install it on a simulator you don't mind wiping: every flow starts with `clearState`, which erases the
   app's data on that simulator. Use a dedicated one, e.g.

   ```bash
   xcrun simctl create "Maestro iPhone" "iPhone 17 Pro"
   ```

3. Run all flows, or one:

   ```bash
   maestro --device "<simulator UDID>" test .maestro/
   maestro --device "<simulator UDID>" test .maestro/data-loss/02-kill-immediately-after-save.yaml
   ```

`maestro studio` opens a browser UI for finding selectors while writing new flows.

## Selectors

Prefer `testID`s over screen coordinates or display text. Added for these tests:

- `draw-point-button`, `draw-line-button`, `draw-polygon-button`, `edit-shape-button` (map toolbar)
- `main-menu-button` (home button)
- `switch-project-button` (swap icon in the main menu header; not in the build these tests were first run on,
  so `open-project-switcher` falls back to its screen position)
- `notebook-footer-<pageKey>`, e.g. `notebook-footer-notes` (notebook footer icons)
- every form text field gets its form field `name`, e.g. `project_name`, `note`

`IconButton` now passes `testID` through, so other icon buttons only need the prop.

## Caveats

- **Release builds upload to Sentry.** The Xcode bundle phase hardcodes `export SENTRY_DISABLE_AUTO_UPLOAD=false`
  and the debug-symbols phase uploads on every Release build, so a local Release simulator build sends
  sourcemaps and dSYMs to Sentry under the current version. Setting the variable in the environment does not
  override it.
- Map points are tapped by screen percentage. Most Spots are drawn on the Mapbox GL canvas, so flows verify them
  through the Notebook and Datasets panel, not by looking at the map.
- The compass sensor can't be tested on a simulator.
