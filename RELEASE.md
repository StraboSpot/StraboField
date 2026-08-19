# Release Process

StraboSpot2 has two release paths:

1. **[Normal RC → Master](#1-normal-rc--master)** — the standard flow: stabilize on an `rc-*` branch, then merge to `master` and tag.
2. **[Hotfix on Master](#2-hotfix-on-master-no-rc-merge)** — an urgent patch applied directly to `master` without merging from the rc branch.

## How versioning & releases are wired

- **Version bump:** `npm run bump-patch` (or `bump-minor` / `bump-major`) runs `npm version <level> --no-git-tag-version` (updates `package.json`) then `bundle exec fastlane bump`, which runs `inc_ver_ios` (iOS build number) and `inc_ver_and` (Android `versionCode` + `versionName` from `package.json`).
- **Draft / prerelease:** pushing to any `rc-*` branch triggers [`.github/workflows/rc-draft.yml`](.github/workflows/rc-draft.yml), which creates/updates a **draft prerelease**.
- **Official release:** pushing a `v*` **tag** triggers [`.github/workflows/changelog.yml`](.github/workflows/changelog.yml), which builds the changelog from `git log <prev v-tag>..<new tag>` (previous tag chosen in `sort -V` order) and publishes a non-prerelease GitHub Release.
- **Store release notes:** `npm run release-notes` (`scripts/release-notes.js`) generates **draft** user-facing "What's New" copy from the commit range and writes the files fastlane reads — `fastlane/metadata/en-US/release_notes.txt` (App Store / `deliver`) and `fastlane/metadata/android/en-US/changelogs/<versionCode>.txt` (Play / `supply`, kept under 400 chars). It gathers + templates only; **review/rewrite the draft for a general audience before uploading** (ask Claude to "polish the store notes"). It auto-detects the previous release tag, ignoring malformed ones; override with `node scripts/release-notes.js <from-tag>`. Note: the Fastfile does not yet wire `deliver`/`supply`, so these files are currently copy-pasted into each console.

### Rules that apply to both paths

- **Tag on `master`, never on the rc branch.**
- **Always use the `v` prefix** — `v2.29.14`, not `2.29.14`.
- **Never hand-write the changelog** — it is generated from commit subjects, so write meaningful `feat(...)` / `fix(...)` messages. The changelog filters out `chore(release)` and a few `fix:` prefixes (`use`/`fetch`/`force`/`make`/`prefer`/`delete`) — avoid those verbs for user-facing fixes.
- Any changelog-affecting commit must be on `master` **before** you push the tag.

---

## 1. Normal RC → Master

Print this checklist anytime with `npm run start-rc`.

1. **Cut the RC branch** from `dev`: `git checkout -b rc-{version} dev`.
2. **Bump the version:** `npm run bump-patch` (or `bump-minor` / `bump-major`).
3. **Commit & push** to the rc branch → triggers the **draft release**.
4. **Stabilize:** bug fixes land directly on `rc-{version}`; each push auto-updates the draft.
5. **Merge** `rc-{version}` → `master` and push.
6. **Generate store notes:** `npm run release-notes`, then review/polish the drafts in `fastlane/metadata/`.
7. **Tag on master:** `git tag v{version}`.
8. **Push the tag:** `git push origin v{version}` → publishes the official release + changelog.

---

## 2. Hotfix on Master (no rc merge)

Print this checklist anytime with `npm run start-hotfix`.

Use this when a fix must ship now and you are **not** merging the rc branch. The trade-off vs. the normal flow: there is no rc staging/QA gate, and the fix does **not** automatically exist in `rc-*` — you must forward-port it (step 9) or it regresses on the next rc → master merge.

### Checklist

1. **Start clean on master:**
   ```bash
   git checkout master && git pull origin master
   ```
   Confirm the latest released tag first so you do not collide (`master`'s line trails the rc line):
   ```bash
   git tag --sort=-v:refname | grep '^v2\.29' | head -3
   ```

2. **Apply & commit the fix** to master with a conventional `fix: ...` subject (it becomes the changelog).

3. **Bump the patch version:**
   ```bash
   npm run bump-patch
   ```

4. **Verify all version surfaces moved:**
   - `package.json` version.
   - Android `versionName` **and** `versionCode` in `android/app/build.gradle`.
   - iOS build number in `ios/StraboSpot2.xcodeproj/project.pbxproj`.
   - ⚠️ **Known stale spot:** iOS `MARKETING_VERSION` has drifted from `package.json` before (was `2.26.3` while the app was `2.29.x`). Confirm it matches the new version; fix it in `project.pbxproj` if fastlane did not.
   - Commit the bump: `chore(release): bump app version to <version> and build to <code>`.

5. **Push master** (not an `rc-*` branch — that would fire the draft workflow):
   ```bash
   git push origin master
   ```

6. **Generate store release notes** (draft, then polish):
   ```bash
   npm run release-notes
   ```
   Review/rewrite `fastlane/metadata/en-US/release_notes.txt` (App Store) and `fastlane/metadata/android/en-US/changelogs/<versionCode>.txt` (Play, <400 chars) for a general audience before uploading.

7. **Tag on master → publishes the official release:**
   ```bash
   git tag v<version>
   git push origin v<version>
   ```
   Then confirm `changelog.yml` ran green and the release notes contain **only** the hotfix commits.

8. **Build & ship the binaries** (the tag only makes release notes; it does not build the app):
   - iOS → TestFlight: `npm run deploy-beta`.
   - Android → `npm run bundle:android && npm run deploy:android`, then upload the `.aab` from `android/app/build/outputs/bundle/release/`.
   - Web (if affected): `npm run web-deploy`.

9. **Upload Sentry sourcemaps** for the new version so the build symbolicates:
   ```bash
   npm run upload-sourcemaps
   ```

10. 🔁 **Forward-port the fix** — the step the rc merge normally does for you. Without it the bug returns on the next rc → master release.
   ```bash
   git checkout rc-2.30.x && git pull
   git cherry-pick <hotfix-commit-sha>   # the FIX commit, NOT the version-bump commit
   git push origin rc-2.30.x
   ```
   Cherry-pick into any other active line (`dev`, feature branches) that needs it. Do **not** cherry-pick the version-bump commit — rc owns its own version line.

### The three things that bite on this path

1. Forgetting the step-10 forward-port, so the bug comes back.
2. The stale iOS `MARKETING_VERSION`.
3. A tag/version collision because `master`'s line (2.29.x) trails the rc line (2.30.x).
