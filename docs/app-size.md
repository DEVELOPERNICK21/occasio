# App size (Android APK and AAB, iOS IPA)

Measured on 2026-11-09 from the same code, with and without the changes below. Android was built twice (before and after) and compared area by area; iOS was built once after (an unsigned Release build, then stripped the way an archive strips it) and compared with the last archive from 13 October.

## Result

| | Before | After | Change |
|---|---|---|---|
| **Android release APK** (universal, every CPU type) | 119.6 MB | **52.0 MB** | -56% |
| **Android release AAB** (what Play receives) | 86.2 MB | **43.9 MB** | -49% |
| **One arm64 phone downloads** (estimated from the APK parts) | 60.8 MB | **37.7 MB** | -38% |
| One 32-bit ARM phone downloads | 54.0 MB | **31.1 MB** | -42% |
| **iOS app**, uncompressed | 65 MB (13 Oct archive) | **58 MB** | -11% |
| **iOS IPA**, zipped | 27 MB (13 Oct archive) | **21 MB** | -22% |

The iOS "before" is the last archive, made from older code: I did not build a same-code "before" for iOS (it would mean reverting the package changes and reinstalling pods). Today's changes account for about 4.8 MB of the 7 MB (sounds about 3.5 MB, JS about 1.3 MB); the rest is the October archive carrying a 790 KB launcher image and an older icon set. The App Store sends each phone a thinned copy that is smaller than the IPA; Xcode Organizer's *App Thinning Size Report* gives the exact figure when you next archive.

## Android: what was in the 119.6 MB APK

| Area (compressed, MB) | Before | After | What changed |
|---|---|---|---|
| Java code (dex) | 19.5 | **7.8** | R8 and resource shrinking turned on for release. It was off, so every class of Firebase, RevenueCat and the Google libraries shipped, even unused ones |
| `lib/x86` + `lib/x86_64` | 43.6 | **0** | Phones are ARM. x86 is for emulators on Intel Macs and roughly doubled the native code. Release now carries only `arm64-v8a` and `armeabi-v7a` |
| `lib/arm64-v8a` + `lib/armeabi-v7a` | 35.2 | 34.3 | React Native itself (6.7 MB), Hermes (2.4), reanimated, worklets, screens, crop and Crashlytics. Little left to trim here |
| Sounds | 11.4 | **2.3** | Each sound shipped twice (our copy in `res/raw` and Metro's copy), and the music beds were 256 kbps. Now one copy each at 96 kbps |
| JS bundle | 6.2 | **4.9** | `lucide-react-native` was bundled whole (all 1,800 icons, about 600 KB) and `react-native-gesture-handler` was bundled unused. Now only the 70 icons used |
| Resource table, other | 2.7 | 2.3 | |

### What was changed

| Change | Where |
|---|---|
| R8 minify and `shrinkResources` on in release | `android/app/build.gradle` |
| Release keeps only ARM (`ndk.abiFilters`); the build compiles only ARM (`reactNativeArchitectures`); Gradle heap raised to 4 GB for R8 | `build.gradle`, `gradle.properties` |
| Keep rule for the five sounds (they are loaded by name, so the shrinker deleted them) | `android/app/src/main/res/raw/sound_keep.xml` |
| Sounds re-encoded to 96 kbps MP3 (same files, same names, no code change); Android's copies match the iOS ones | `src/features/create/assets/sounds/*.mp3`, `android/app/src/main/res/raw/sfx_*.mp3` |
| Android no longer bundles the sounds through Metro (it plays its own `res/raw` copies) | `celebrationAssets.ts` and `celebrationAssets.android.ts` |
| Four packages that nothing imported were removed: `lottie-react-native`, `react-native-image-picker`, `react-native-gesture-handler`, `@react-native/new-app-screen`; the five unused Lottie JSON files, and the floating `androidx.activity:1.9.+` dependency (which also stopped offline builds) | `package.json`, both lockfiles, `index.js`, `ios/Podfile.lock` |
| Icons come through one barrel that loads each from its own file | `src/shared/ui/icons/lucide.ts` (49 files repointed), guarded by `__tests__/architecture/iconBarrel.test.ts` |
| Dead code: `occasionSounds.ts` and five unused exports in `createHome.ts` | `src/features/create/domain` |

### Checked on a device, not only measured

The shrunk release build was installed on the arm64 emulator (re-signed with the public debug key so it updated in place) and launched: no crash, Firebase and Crashlytics start, RevenueCat configures, Home and the festivals list draw with every icon. The photo cropper's and the other libraries' classes were confirmed present in R8's output. The shrinker's one real casualty (the sounds) was found by inspecting the resource table, fixed, and re-checked. **Not exercised:** Google sign-in (needs the release key's SHA-1 in Firebase), a real purchase, push, and actually hearing the sounds. Do a pass on a real phone before this goes to production, because R8 can only be proven on the paths that run.

## iOS

| Item | Before (13 Oct archive) | After |
|---|---|---|
| Main binary (stripped) | 30.4 MB | 30.2 MB |
| React, Hermes and dependencies (prebuilt frameworks) | 17.7 MB | 17.5 MB |
| JS bundle | 7.6 MB | 6.1 MB |
| Bundled assets | 6.7 MB (sounds 5.6 MB) | 2.4 MB (sounds 2.1 MB) |
| App, uncompressed | 65 MB | 58 MB |
| IPA, zipped | 27 MB | 21 MB |

The iOS Release settings were already right: arm64 only, dead-code stripping on, symbols stripped on archive, no bitcode. The gains are the shared ones (sounds, JS) plus four pods that went away with their packages (`lottie-ios`, `lottie-react-native`, `RNGestureHandler`, `react-native-image-picker`), done with `pod install` (84 lines out of `Podfile.lock`, nothing added). I did not turn on link-time optimisation or `-Osize`: for this mostly C++ and Objective-C binary the gain is a few percent at best, and a changed compiler setting across 100 pods is a risk I could not test on a device.

## Measuring it again

```sh
# Android (offline once Gradle has everything cached)
cd android && ./gradlew --offline assembleRelease bundleRelease && cd ..
python3 scripts/size/apk_report.py android/app/build/outputs/apk/release/app-release.apk [older.apk]

# iOS: an unsigned Release build, then the report
cd ios && xcodebuild -workspace Occasio.xcworkspace -scheme Occasio -configuration Release \
  -sdk iphoneos -destination 'generic/platform=iOS' CODE_SIGNING_ALLOWED=NO build && cd ..
sh scripts/size/ios_report.sh ~/Library/Developer/Xcode/DerivedData/Occasio-*/Build/Products/Release-iphoneos/Occasio.app
```

`pod install` needs `LANG=en_US.UTF-8` on this machine or CocoaPods fails with an encoding error. An unsigned build leaves the main binary unstripped (about 61 MB); an archive strips it (about 30 MB), so compare archives with archives.

## Keeping it small

- **Icons:** import from `src/shared/ui/icons/lucide`, never from `lucide-react-native`, and add one line to the barrel for a new icon. A test fails otherwise.
- **Sounds:** keep music beds near 96 kbps. Android plays `res/raw/sfx_*` by name, so a new sound needs a copy there, an entry in `RAW_NAME`, and its name covered by `sound_keep.xml` (the `sfx_*` pattern already does). Do not `require` a file in `celebrationAssets.android.ts`: Metro would ship it twice.
- **Native packages:** before adding one, count what it brings (`grep -rl "from 'package'" src`). A package nothing imports still ships its native library on both platforms.
- **Release ABIs:** to test a release build on an Intel-Mac emulator, build with `-PreactNativeArchitectures=x86_64` and temporarily add `x86_64` to `abiFilters`.
- **Pin versions in Gradle.** A floating version like `1.9.+` makes builds depend on the network and blocks offline builds.
- Check size after any dependency change; a few MB creeps in quietly.

## What is left, biggest first

1. **Native code, about 34 MB on Android and about 30 MB on iOS.** React Native, Hermes and reanimated are not negotiable. The Firestore SDK (with gRPC) is the largest optional piece. The app uses it in six files; replacing it would mean moving their reads and writes to the HTTP API, which is a real rewrite and was not done. I did not measure how much it would save.
2. **`@revenuecat/purchases-js-hybrid-mappings`, about 960 KB of JS** (20% of the bundle). It is RevenueCat's web mode, bundled because `react-native-purchases` requires it unconditionally. A Metro alias to an empty module on native would drop it, but it patches a library's internals and could not be verified on a device, so it is not done.
3. **Music beds** could go to 64 kbps for another 0.7 MB, at a cost in quality.
4. **`libucrop` (1.1 MB)** comes with the photo cropper; replacing it means dropping the crop step.
5. **Crashlytics NDK (about 1.3 MB)** reports native crashes. Worth keeping for a React Native app.
