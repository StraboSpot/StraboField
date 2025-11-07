# Sentry Source Maps and Debug Symbols

This document explains how to upload source maps and debug symbols to Sentry for proper error tracking and debugging in StraboSpot2.

## Overview

Source maps allow Sentry to transform minified/obfuscated JavaScript stack traces back into readable code with proper file names and line numbers. Debug symbols do the same for native code crashes.

## Prerequisites

- Sentry CLI is installed via `@sentry/cli` package
- `sentry.properties` files are configured in `ios/` and `android/` directories
- `env.json` contains valid `Error_reporting_DSN`
- App version in `package.json` matches iOS/Android versions

## Configuration Files

### Sentry Properties Files

Both `ios/sentry.properties` and `android/sentry.properties` contain:

```properties
defaults.url=https://sentry.io/
defaults.org=university-of-kansas
defaults.project=strabospot-2
auth.token=YOUR_AUTH_TOKEN
```

### Android Configuration

The Android Gradle configuration (`android/app/build.gradle:88-95`) includes:

```gradle
sentry {
    autoUploadProguardMapping = enableProguardInReleaseBuilds
    uploadNativeSymbols = true
    includeNativeSources = true
    tracingInstrumentation {
        enabled = true
    }
}
```

This automatically uploads:
- ProGuard mapping files (for de-obfuscating Java/Kotlin code)
- Native debug symbols (for C++ crashes)
- Native source code references

### iOS Configuration

iOS has a build phase "Upload Debug Symbols to Sentry" in the Xcode project that automatically uploads dSYM files during builds.

## Upload Process

### Step 1: Bundle JavaScript

Before uploading source maps, you must create the JavaScript bundles with source maps.

**For iOS:**
```bash
npm run bundle:ios
```

This creates:
- `ios/main.jsbundle` - Minified JavaScript bundle
- `ios/main.jsbundle.map` - Source map file

**For Android:**
```bash
npm run bundle:android
```

This creates:
- `android/app/src/main/assets/index.android.bundle` - Minified JavaScript bundle
- `android/index.android.bundle.map` - Source map file

### Step 2: Upload Source Maps

**For iOS only:**
```bash
npm run upload-sourcemaps-ios
```

**For Android only:**
```bash
npm run upload-sourcemaps-android
```

**For both platforms:**
```bash
npm run upload-sourcemaps
```

This runs both uploads in parallel.

### What These Scripts Do

Each upload script:

1. **Creates a Sentry Release**
   - Release name format: `org.StraboSpot2-{version}` (e.g., `org.StraboSpot2-2.23.5`)
   - Uses version from `package.json`

2. **Uploads Source Maps**
   - Uploads both the bundle and map files
   - Uses `--strip-prefix .` to normalize file paths
   - Associates files with the release and distribution

3. **Finalizes the Release**
   - Marks the release as complete in Sentry
   - Makes source maps available for error processing

## Release and Distribution

### Release Naming

Releases follow the format: `org.StraboSpot2-{version}`

This **must match** the release configured in `App.js:28`:

```javascript
Sentry.init({
  release: RELEASE_NAME,  // 'org.StraboSpot2-{version}'
  dist: RELEASE_NAME,
  // ...
});
```

### Distribution

The `dist` (distribution) value is set to the same as the release name. This helps Sentry match errors to the correct source maps.

## Complete Deployment Workflow

### iOS Deployment

1. **Bundle JavaScript:**
   ```bash
   npm run bundle:ios
   ```

2. **Upload Source Maps:**
   ```bash
   npm run upload-sourcemaps-ios
   ```

3. **Build in Xcode:**
   - Open project in Xcode
   - Archive and build for release
   - dSYM files are automatically uploaded during build

4. **Deploy to TestFlight/App Store**

### Android Deployment

1. **Bundle JavaScript:**
   ```bash
   npm run bundle:android
   ```

2. **Upload Source Maps:**
   ```bash
   npm run upload-sourcemaps-android
   ```

3. **Build Release:**
   ```bash
   npm run deploy:android
   ```
   - ProGuard mapping files are automatically uploaded during build
   - Creates `.aab` file in `android/app/build/outputs/bundle/release/`

4. **Deploy to Play Store**

## Troubleshooting

### Source Maps Not Working

1. **Verify version matches:**
   - Check `package.json` version
   - Check `android/app/build.gradle` versionName
   - Check `ios/StraboSpot2/Info.plist` CFBundleShortVersionString
   - Check `App.js` RELEASE_NAME constant

2. **Check files exist:**
   ```bash
   ls -la ios/main.jsbundle*
   ls -la android/app/src/main/assets/index.android.bundle*
   ls -la android/index.android.bundle.map
   ```

3. **Verify upload in Sentry:**
   - Go to Sentry dashboard
   - Navigate to Settings > Projects > strabospot-2 > Source Maps
   - Find your release (e.g., `org.StraboSpot2-2.23.5`)
   - Verify artifacts are listed

### Common Errors

**"Release already exists"**
- This is normal if you've already created the release
- The scripts handle this gracefully and continue

**"No such file or directory"**
- Run the bundle command before uploading
- Check that paths in scripts match actual file locations

**"Invalid auth token"**
- Verify `sentry.properties` files have correct auth token
- Regenerate token in Sentry settings if needed

**Stack traces still minified**
- Ensure release name in app matches uploaded release
- Check that both bundle AND map file were uploaded
- Verify `dist` value matches between app and upload

## Helper Scripts

### Create a New Release
```bash
npm run sentry:release:new
```

Creates a new release in Sentry without uploading files.

### Finalize a Release
```bash
npm run sentry:release:finalize
```

Marks a release as complete in Sentry.

## Version Bumping

When bumping versions, the scripts automatically use the new version:

```bash
npm run bump-patch  # or bump-minor, bump-major
```

This updates:
- `package.json` version
- iOS version in `Info.plist`
- Android version in `build.gradle`

Then upload source maps with the new version:
```bash
npm run bundle:ios
npm run bundle:android
npm run upload-sourcemaps
```

## Android Automatic Uploads

For Android release builds, ProGuard mappings and native symbols are automatically uploaded during the build process when:

- Building with `npm run deploy:android`
- Building release builds in Android Studio
- The `sentry.gradle` plugin is configured (already done)

You still need to manually upload JavaScript source maps.

## iOS Automatic Uploads

For iOS builds, dSYM files are automatically uploaded during Xcode builds via the "Upload Debug Symbols to Sentry" build phase.

You still need to manually upload JavaScript source maps.

## Best Practices

1. **Always upload before deploying:**
   - Upload source maps before distributing the app
   - This ensures errors from new builds can be de-obfuscated

2. **Upload for every release:**
   - Even patch versions should have source maps uploaded
   - Different builds may have different line numbers

3. **Verify uploads:**
   - Check Sentry dashboard after uploading
   - Test by triggering a test error in the app

4. **Keep source maps private:**
   - Never commit source map files to git (they're in `.gitignore`)
   - Source maps are only uploaded to Sentry, not distributed with app

5. **Use consistent versioning:**
   - Always use `npm run bump-*` scripts to update versions
   - This keeps package.json, iOS, and Android versions in sync

## Sentry CLI Commands Reference

### Manual Upload (if needed)

```bash
# Create release
sentry-cli releases new org.StraboSpot2-2.23.5

# Upload source maps
sentry-cli releases files org.StraboSpot2-2.23.5 \
  upload-sourcemaps \
  --strip-prefix . \
  ios/main.jsbundle \
  ios/main.jsbundle.map \
  --dist org.StraboSpot2-2.23.5

# Finalize release
sentry-cli releases finalize org.StraboSpot2-2.23.5
```

### List Releases
```bash
sentry-cli releases list
```

### Delete a Release
```bash
sentry-cli releases delete org.StraboSpot2-2.23.5
```

## Additional Resources

- [Sentry React Native Documentation](https://docs.sentry.io/platforms/react-native/)
- [Sentry CLI Documentation](https://docs.sentry.io/product/cli/)
- [React Native Source Maps](https://docs.sentry.io/platforms/react-native/sourcemaps/)
- [Android ProGuard Mapping](https://docs.sentry.io/platforms/android/proguard/)