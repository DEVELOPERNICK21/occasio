# App Check: is this the real app?

Firebase App Check gives the app a short-lived token that says "this request comes from the genuine Occasio app on a real device": **App Attest** on iPhone, **Play Integrity** on Android. Our create endpoint (`POST /api/v1/creations`) checks it. It says nothing about who the person is, so it never replaces sign-in. What it does is refuse scripts, emulator farms and modified copies of the app, which is what makes a device signal for the free card worth trusting later (see [free-card-abuse.md](./free-card-abuse.md)).

## How it works

* **App** (`src/shared/firebase/appCheck.ts`): starts at launch (`App.tsx`) and `httpClient` adds `X-Firebase-AppCheck` to every write (not to reads). Debug builds, simulators and emulators use the **debug provider**; release builds use App Attest (falling back to DeviceCheck on an iPhone where App Attest is unavailable) and Play Integrity. If anything goes wrong (a build from before the native module existed, a device that cannot attest, a slow network) the request simply goes **without** a token after at most 5 seconds. It never throws and never blocks sign-in.
* **Server** (`docs-site/src/lib/appCheck.ts`, used by `api/v1/creations/route.ts`): `APP_CHECK_MODE` on Vercel:

| Mode | What happens |
|---|---|
| `off` | Not looked at |
| `log` (default, also for any typo) | Checked; every result is logged as `[app-check] { result, mode }` (`valid`, `missing`, `invalid`); nothing is refused |
| `enforce` | A request without a valid token gets `403 APP_CHECK_FAILED` ("Update the app and try again"); only refusals are logged |

## Set up (once)

1. **Firebase console, App Check, Apps.** Register the **iOS** app with the **App Attest** provider (and **DeviceCheck** as its fallback, which needs an Apple DeviceCheck key: the same kind of key the later per-device free-card flag will use), and the **Android** app with **Play Integrity**.
   * Android: Play Integrity needs the app's **SHA-256 certificate fingerprints** in the Firebase Android app settings (both the upload key and, once published, Play's app-signing key), and the **Play Integrity API** enabled in the linked Google Cloud project.
   * Do **not** turn on "Enforce" for Firebase products there (Auth, Firestore, Storage) yet: enforcing it on Auth needs Identity Platform, and enforcing it on Firestore or Storage would also lock out any older app build. The server check below is the one that matters.
2. **Debug tokens** (so your simulator and emulator builds pass). Run a debug build; the native log prints a debug token (Xcode console: "Firebase App Check Debug Token"; Android: `adb logcat | grep -i "debug token"`). Paste it in the console, App Check, Apps, your app, **Manage debug tokens**. Keep these private: anyone with one can pass App Check.
3. **Rebuild the apps natively.** This adds a native module:
   * iOS: `cd ios && bundle exec pod install`, then build. The entitlement `com.apple.developer.devicecheck.appattest-environment` is in `Occasio.entitlements`. If Xcode complains about signing, open Signing & Capabilities and make sure **App Attest** is listed, or enable it for the App ID in the Apple Developer portal.
   * Android: a normal Gradle build.
   * **Old dev builds without the module keep working**; they just send no token.
4. **Watch, then enforce.** Leave `APP_CHECK_MODE` unset (log). Use a **release / TestFlight / internal-test** build on a real device (simulators and emulators use the debug provider, which proves nothing), create a card, and look in the Vercel logs for `[app-check] { result: 'valid' }`. When real devices show up valid, set `APP_CHECK_MODE=enforce` and redeploy.

## Before you enforce

* There is no published app version yet, so nobody is locked out by an old build. Once there is, an app version from before App Check sends no token, so enforcing refuses it: only enforce after most people have updated, or keep `log` and rely on step 2 of the free-card work.
* A real person on a rooted phone, an old Play Services, or a device that fails Play Integrity will get `APP_CHECK_FAILED` when enforcing. The app shows the server's message in the "That did not go through" sheet.
* Tokens are not single-use here (no replay protection). Single-use ("limited use") tokens exist and can be added to this endpoint later; they cost an extra network call per request.

## Where it lives

* App: `src/shared/firebase/appCheck.ts`, `src/shared/api/httpClient.ts`, `ios/Occasio/AppDelegate.swift`, `ios/Occasio/Occasio.entitlements`.
* Server: `docs-site/src/lib/appCheck.ts` (+ `appCheck.test.ts`), `docs-site/src/app/api/v1/creations/route.ts`.
* Tests: `__tests__/shared/appCheck.test.ts`, `__tests__/shared/httpClientAppCheck.test.ts`.
