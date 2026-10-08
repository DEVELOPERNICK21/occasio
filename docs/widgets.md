# Home-screen widgets (Phase 1)

Three widgets on Android and iOS, plus iOS lock-screen versions. Phase 2 ideas are at the end.

| Widget | Size | Shows | Tap opens |
|---|---|---|---|
| **Next up** | iOS small · Android 2×2 · iOS lock screen (rectangular, inline) | The next birthday/anniversary, e.g. "Mom · Birthday — 3 days". Turns coral on the day, with "Auto-send is on" when armed | A new card for that person |
| **Coming up** | iOS medium · Android 4×2 | Next three dates, with a "+ Quick wish" button | A row → card for that person. Button → quick card |
| **Make a card** | iOS small · Android 2×2 | Static shortcut | A new quick card |

Empty state (nobody saved, or signed out): "Add someone you love" → opens Add person.

## Privacy — relationship labels, never names

Widgets sit on home and lock screens that other people can see. The snapshot the
app hands to the widgets contains **only**: a Vault person id (to open the right
card), the relationship label (`Mom`, `Partner`, `Someone special`…), the occasion,
the next two dates, and whether auto-send is on. No names, photos, messages,
phone numbers or emails — `__tests__/widgets/widgetSnapshot.test.ts` fails if a
name ever appears.

Two people with the same relationship get the first initial so they can be told
apart (`Friend (R)`, `Friend (M)`), and a number if that still collides. To drop
the initial, edit `assignWidgetLabels` in `domain/widgetSnapshot.ts`.

The snapshot is wiped on sign-out and account deletion (`useWidgetSync`).

## How it works

```
Vault (Firestore) ─▶ useWidgetSync ─▶ buildWidgetSnapshot ─▶ OccasioWidgets (native module)
                                                              ├─ iOS: App Group UserDefaults ─▶ WidgetKit extension
                                                              └─ Android: SharedPreferences  ─▶ AppWidgetProviders
widget tap ─▶ occasio://… ─▶ Linking ─▶ useWidgetLinks ─▶ Create flow / Vault
```

* The widgets count days **on the device**, so they keep counting down without the
  app. iOS schedules an entry just after each of the next 14 midnights; Android
  redraws every 30 min and on date/time/zone change.
* The snapshot holds the next **two** occurrences per date, so the widgets never
  need calendar logic. Feb 29 falls on Feb 28 in non-leap years — the same day
  auto-send fires (note: the in-app Vault countdown still rolls it to 1 Mar).
* Code: `src/features/widgets/` (domain/data/application/ui), native module
  `OccasioWidgets` (`ios/Occasio/OccasioWidgetsBridge.*`,
  `android/.../widgets/OccasioWidgetsModule.kt`), iOS extension `ios/OccasioWidgets/`,
  Android widgets `android/app/src/main/java/com/occasio/widgets/` + `res/`.

### Deep links (the contract)

| Link | Result |
|---|---|
| `occasio://create/quick` | New quick card → Add photos |
| `occasio://card/new?person=<id>&occasion=birthday\|anniversary` | Quick card for that person (an anniversary starts as an anniversary card). Unknown person → plain quick card |
| `occasio://vault` / `occasio://vault/add` | Vault / Add person |

Defined in `src/features/widgets/domain/widgetLinks.ts`; the Swift and Kotlin copies
(`WidgetLinks`) must match. A link always resets the Create stack to
`Create home → Add photos`, so tapping while another card is half made is safe.

## One-time setup you must do (iOS)

The extension reads data through an **App Group**, which Apple requires you to
register. Until this is done, a device build can't share data and the bridge
rejects with `App Group … is not available` (the app itself keeps working).

1. Open `ios/Occasio.xcworkspace` → select the **Occasio** target → *Signing & Capabilities*
   → confirm **App Groups** shows `group.com.occasio.ios` (already in the entitlements file).
2. Select the **OccasioWidgets** target → same tab → team `JY9B33N72P`, automatic signing,
   **App Groups** → `group.com.occasio.ios`. Xcode registers the group and the
   `com.occasio.ios.widgets` App ID for you; if it can't, add both in
   developer.apple.com → *Certificates, Identifiers & Profiles*.
3. If you change the bundle ID, change it in **four** places: the two entitlements
   files, `WidgetShared.appGroup` (`ios/OccasioWidgets/WidgetModels.swift`) and the
   constant in `ios/Occasio/OccasioWidgetsBridge.swift`.

Android needs nothing.

## What was verified (and what wasn't)

Verified on an Android 17 emulator and the iOS 26 simulator:
* JS → native module → widgets on **Android**, on the real React Native 0.86 New
  Architecture app; stored data contains labels only.
* All three Android widgets in the launcher picker and on the home screen.
* Widget taps launch the app, and each `occasio://` link lands on the right screen.
* iOS widgets (the real extension sources) in the system widget gallery and on the
  home screen: normal, "today", and empty states.
* Swift link builder output matches the TS parser; countdown maths incl. year rollover.
* `tsc` clean, ESLint no errors, Jest 218/218 (20 new).

**Not verified:**
* The **iOS** React Native bridge at runtime and iOS widget taps → app. The full iOS app
  does not link on this machine (undefined `facebook::react::…` symbols from RNDateTimePicker /
  Gesture Handler / SVG). It fails identically with these changes removed, so it is not
  caused by the widgets — try a build in Xcode; if it fails there too, a fresh `pod install`
  is the first thing to try. The Swift bridge and `AppDelegate` change compile.
* iOS **lock-screen** widgets (compile and share the same data, but I didn't place them).
* Real-device behaviour, battery, and the Apple App Group registration above.

## Phase 2 (not built)

* "Review before it sends" state, then a Live Activity for the 2-hour review window
  (needs push-updated state).
* Photos or names on widgets (deliberately excluded).
* Widget-gallery screenshots for the store listings.
