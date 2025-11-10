# Over-The-Air (OTA) Updates with EAS

This guide explains how to use EAS Updates to push JavaScript-only updates directly to users without going through the app stores.

## Table of Contents

- [Overview](#overview)
- [Setup (One-Time)](#setup-one-time)
- [What Can Be Updated OTA](#what-can-be-updated-ota)
- [Deployment Workflows](#deployment-workflows)
- [Commands Reference](#commands-reference)
- [Troubleshooting](#troubleshooting)

## Overview

EAS Updates allows you to push JavaScript bundle updates directly to your users' devices without requiring an app store submission. This is perfect for:

- Bug fixes in JavaScript code
- UI/UX improvements
- Feature updates that don't require native code changes
- Quick hotfixes

**Important:** EAS Updates uses the `appVersion` policy, which means updates are tied to your app version in `package.json`. Users will only receive OTA updates that match their installed app's native version.

## Setup (One-Time)

### 1. Create an Expo Account

If you don't have one already:
```bash
eas login
```

Or create an account at https://expo.dev

### 2. Configure Your Project

Run the following command to link your project to EAS:
```bash
eas init
```

This will:
- Create an EAS project
- Update `app.json` with your project ID
- Generate a unique project ID

**Important:** After running `eas init`, you need to update two places in `app.json`:

1. Replace `[your-project-id]` in the `updates.url` field
2. Replace `[your-project-id]` in the `extra.eas.projectId` field

Example:
```json
{
  "expo": {
    "updates": {
      "url": "https://u.expo.dev/abc123-def456-ghi789"
    },
    "extra": {
      "eas": {
        "projectId": "abc123-def456-ghi789"
      }
    }
  }
}
```

### 3. Update App Configuration

Make sure your `app.json` version matches `package.json`:
```json
{
  "expo": {
    "version": "2.23.6"  // Must match package.json version
  }
}
```

### 4. Build New App Binaries

After initial setup, you must create new builds for iOS and Android that include the EAS Updates configuration:

**iOS:**
```bash
npm run bundle:ios
# Then build and submit to TestFlight/App Store
```

**Android:**
```bash
npm run bundle:android
npm run deploy:android
# Then submit the .aab to Google Play
```

**Note:** Users must install these new builds before they can receive OTA updates.

## What Can Be Updated OTA

### ✅ Can Be Updated OTA

- JavaScript code changes
- React component updates
- UI styling changes
- Business logic modifications
- Bug fixes in JS code
- Assets bundled with JavaScript
- Form definitions in `/src/assets/forms/`
- Redux logic and state management
- Navigation changes (React Navigation)
- Web-specific code (`.web.js` files)

### ❌ Cannot Be Updated OTA (Requires App Store Submission)

- Native code changes (iOS/Android)
- Changes to `ios/` or `android/` directories
- New native dependencies
- Updates to native modules
- Changes to app permissions
- Changes to `AndroidManifest.xml` or `Info.plist`
- Version number changes (requires new build)
- App icon or splash screen changes (native assets)
- Changes to Podfile or build.gradle

## Deployment Workflows

### Scenario 1: JavaScript-Only Hotfix (Use OTA)

**Example:** Fix a bug in spot creation logic

```bash
# 1. Make your JavaScript changes
# Edit src/modules/spots/useSpots.js

# 2. Test locally
npm run android  # or npm run ios

# 3. Commit your changes
git add .
git commit -m "fix: Resolve spot creation validation error"

# 4. Push OTA update to production
npm run ota:update:production

# 5. Users will receive the update on next app launch
```

**Timeline:** Users get the update in minutes, no app store review needed.

### Scenario 2: Patch Release with JS-Only Changes (Use OTA)

**Example:** Small bug fixes and UI improvements

```bash
# 1. Make your changes and commit them
git add .
git commit -m "fix: Multiple small bug fixes"

# 2. Bump patch version (updates package.json, iOS, Android)
npm run bump-patch

# 3. Update app.json version to match
# Edit app.json: "version": "2.23.7"

# 4. Commit version bump
npm run commit-and-push

# 5. Push OTA update
npm run ota:update:production
```

**Note:** Even though you bumped the version, existing users on 2.23.6 won't see the update. You need to decide:
- Option A: Submit to app stores for version 2.23.7, then use OTA for future 2.23.7 fixes
- Option B: Don't bump version, just use OTA for the fix

### Scenario 3: Minor/Major Release with Native Changes (App Store Required)

**Example:** Add new native module, update React Native version, change permissions

```bash
# 1. Make your changes (JS + native)

# 2. Bump version
npm run bump-minor  # → 2.24.0

# 3. Update app.json version
# Edit app.json: "version": "2.24.0"

# 4. Bundle JavaScript
npm run bundle:ios
npm run bundle:android

# 5. Build and submit to app stores
# iOS: Open Xcode and archive
# Android: npm run deploy:android

# 6. After app store approval, users download 2.24.0

# 7. For future hotfixes to 2.24.0, use OTA:
npm run ota:update:production
```

### Scenario 4: Testing on Beta/Preview Channel

**Example:** Test an update before pushing to production

```bash
# 1. Make your changes and commit

# 2. Push to preview channel
npm run ota:update:preview

# 3. Test with preview build or device

# 4. If all looks good, push to production
npm run ota:update:production
```

## Commands Reference

### Publishing OTA Updates

```bash
# Push to production (most common)
npm run ota:update:production

# Push to preview/beta testing
npm run ota:update:preview

# Push to development
npm run ota:update:development

# Shorthand for production
npm run ota:update
```

### Manual Publishing (Advanced)

```bash
# Publish with custom message
eas update --branch production --message "Fix critical bug in map rendering"

# Publish with custom channel
eas update --channel staging --message "Testing new feature"
```

### View Updates

```bash
# View all updates
eas update:list

# View updates for specific branch
eas update:list --branch production

# View update details
eas update:view <update-id>
```

### Rollback

```bash
# Republish a previous update
eas update:republish --group <update-group-id> --branch production
```

## Versioning Strategy

### Runtime Version Policy

StraboSpot2 uses the `appVersion` policy, which ties OTA updates to the version in `package.json`.

**How it works:**
- App version 2.23.6 only receives OTA updates published for 2.23.6
- App version 2.24.0 only receives OTA updates published for 2.24.0
- Users won't get OTA updates from a different version

### Decision Tree: OTA vs App Store

```
Are you changing native code (ios/, android/, native dependencies)?
├─ YES → Must submit to app stores, cannot use OTA
└─ NO (JS-only changes)
   └─ Do you want to change the version number?
      ├─ YES
      │  ├─ Bump version
      │  ├─ Update app.json version
      │  ├─ Submit to app stores
      │  └─ Use OTA for future fixes to this version
      └─ NO
         └─ Use OTA directly (fastest)
```

## Update Flow for Users

### How Users Receive Updates

1. **On App Launch:**
   - App checks for updates when opened
   - Downloads update in background
   - Update applied on next app restart

2. **Automatic:**
   - No user action required
   - Happens silently
   - Uses minimal data

3. **Fallback:**
   - If update fails, app uses cached bundle
   - No risk of breaking the app

### User Experience

- Users don't see any update prompts
- App may take slightly longer to load on first launch after update
- Update happens automatically on next restart

## Known Issues & Fixes

### React Native 0.79 Compatibility

**Issue:** Expo 54.0.23 has a compatibility issue with React Native 0.79+ where `RCTReleaseLevel` was removed.

**Solution:** A patch has been created at `patches/expo+54.0.23.patch` that fixes this issue. The patch is automatically applied via `patch-package` during `yarn install` or `npm install`.

If you encounter build errors related to `RCTReleaseLevel`, ensure:
1. The patch file exists in `patches/expo+54.0.23.patch`
2. Run `yarn install` or `npm install` to apply the patch
3. Clean and rebuild iOS: `cd ios && bundle exec pod install`

## Troubleshooting

### Issue: "No project ID found"

**Solution:** Run `eas init` to link your project, then update `app.json` with the project ID.

### Issue: Users not receiving updates

**Possible causes:**
1. **Runtime version mismatch:** User's app version doesn't match the published update version
   - Solution: Ensure `app.json` version matches the version users have installed

2. **Update not published:** Update wasn't successfully published
   - Solution: Run `eas update:list` to verify the update exists

3. **Wrong channel:** Update published to wrong channel (e.g., preview instead of production)
   - Solution: Check `eas.json` build profiles and ensure correct channel

4. **Users haven't restarted app:** Updates apply on app restart
   - Solution: Wait for users to restart the app

### Issue: Build fails after adding EAS Updates

**Possible causes:**
1. **iOS Pods not installed:** expo-updates pod not installed
   - Solution: `cd ios && bundle exec pod install`

2. **Android Gradle sync issues:** Expo modules not linked
   - Solution: Clean build: `cd android && ./gradlew clean`

3. **Project ID not set:** `app.json` still has placeholder values
   - Solution: Replace `[your-project-id]` with actual project ID from `eas init`

### Issue: Update published but contains errors

**Solution:** Rollback to previous version
```bash
# List updates to find previous working version
eas update:list --branch production

# Republish the previous update
eas update:republish --group <previous-update-group-id> --branch production
```

### Debugging Updates

```bash
# View recent updates
eas update:list --limit 10

# Check specific update
eas update:view <update-id>

# View build channels and configurations
eas build:list
```

## Best Practices

1. **Always test before publishing:**
   ```bash
   npm run ota:update:preview  # Test on preview channel first
   npm run ota:update:production  # Then push to production
   ```

2. **Use meaningful commit messages:**
   - OTA scripts use your git commit message as the update message
   - Write clear, descriptive commit messages

3. **Keep versions in sync:**
   - Ensure `package.json` and `app.json` versions always match
   - Update both when bumping versions

4. **Document what you ship:**
   - Keep track of which versions are OTA vs app store releases
   - Use git tags for releases

5. **Monitor after publishing:**
   - Check error rates in Sentry after OTA updates
   - Be ready to rollback if issues arise

6. **Plan your releases:**
   - Use OTA for urgent hotfixes
   - Use app stores for planned releases with native changes
   - Batch small changes into OTA updates

## Additional Resources

- [EAS Update Documentation](https://docs.expo.dev/eas-update/introduction/)
- [Runtime Versions Guide](https://docs.expo.dev/eas-update/runtime-versions/)
- [EAS Update Workflows](https://docs.expo.dev/eas-update/developing-with-eas-update/)

## Summary

**Quick Reference:**

| Scenario | Command | Timeline |
|----------|---------|----------|
| JS-only hotfix | `npm run ota:update` | Minutes |
| JS-only patch release | Bump version + OTA or App Store | Your choice |
| Native code changes | Bundle + Submit to stores | Days/weeks |
| Beta testing | `npm run ota:update:preview` | Minutes |
| Rollback | `eas update:republish` | Minutes |

**Remember:** OTA updates are powerful but only work for JavaScript changes. For native changes, you must submit to app stores.