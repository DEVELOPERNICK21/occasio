# Pip, the mascot

Pip is a small orange character in a party hat. He is the app's voice at the quiet moments: when there is nothing to show, when something did not load, and when a card is ready. He was only in onboarding before; he now lives in the places below.

## Where he appears

| Spot (`PipSpot`) | Screen | Look | Component |
|---|---|---|---|
| `vaultEmpty` | Vault, no people yet | hopeful, holds a gift | `EmptyState mascot` |
| `historyEmpty` | History, no cards yet | hopeful | `EmptyState mascot` |
| `noMatch` | Vault / History search with no results | hopeful | `EmptyState mascot` |
| `loadError` | Vault / History failed to load | shocked, with Try again | `EmptyState mascot` |
| `vaultGate`, `historyGate` | Signed-out tabs | wink | `GuestGateScreen mascot` |
| `cardMissing` | History detail for a deleted card | shocked, with Back to History | `EmptyState mascot` |
| `loginWelcome`, `loginSignIn`, `loginSignUp`, `loginForgot` | Sign-in tab and its steps | wink on the welcome step, hopeful after | `PipFriend` (hero on welcome, inline on the steps) |
| `photosPick`, `photosReplace` | The "where is the photo?" sheet | hopeful, holds a gift | `PipFriend variant="inline"` inside `ActionSheet` |
| `shareReady` | Share success | joy, speech bubble beside him | `PipFriend variant="inline"` |
| `ageGate` | Age check, first screen | hopeful | `PipFriend` |
| (no spot) | Badge celebration | joy, beside the medal | `Pip` directly |

## What he does

* He blinks while he waits (three times, then still).
* Tap him: a haptic, a squash-and-bounce, a change of mood for about a second, and the next line for that spot.
* Hero variant: lines pop up above him and disappear after a few seconds. Inline variant: the bubble is always there and the tap cycles it.
* Reduce Motion turns off the squash. The tap, the mood and the line still work.
* Every motion is finite. No looping animation, so nothing keeps the screen busy and the accessibility tree stays quiet.

## While the app waits

A slow action must never look like a frozen screen. Pick the loader by what is waiting:

| Waiting on | Use | Why |
|---|---|---|
| A list or detail screen loading | `SkeletonBone` layouts in `SkeletonLayouts.tsx` | Shows the shape of what is coming; a soft highlight sweeps across each block |
| A slow action the person started (delete card, delete account, remove person) | `BusyOverlay` | Blocks the screen so nothing is tapped twice, shows Pip, cannot be dismissed |
| An in-page wait that is the whole point of the screen (creating or saving a card) | `PipLoader` inline | Pip hops, the line changes the longer it takes |
| A button's own tiny wait (sign in, restore purchases) | `Button loading` | A spinner is enough |

* `PipLoader` shows Pip hopping with his shadow staying on the ground and shrinking as he rises, plus one line from `src/shared/mascot/busyLines.ts`. The line changes with how long it has been, and always ends on a "still working" line, so a slow connection never looks stuck. The lines say what is happening in general; they never invent progress or promise a time.
* `BusyOverlay` waits 250 ms before it appears, so quick work never flashes a dialog (and an iOS Modal opened while an Alert is closing never shows). It is hidden by the caller when the work ends, success or failure.
* Motion is finite, like everything else: Pip hops about 24 times (floats 12 times in the calm variant), the skeleton sweeps about 45 times, then they rest. Reduce Motion turns the hop and the sweep off.

### Calm, not playful, when something is removed

Deleting a card, a person or an account is not a moment for jokes. For those kinds (`isCalmBusy` in `busyLines.ts`) Pip only floats slowly, never carries the gift, and speaks plainly. He hops and holds the gift only while something is being made.

## Where he must NOT appear

Nothing playful near money, a refusal, or something destructive. A calm `BusyOverlay` while a delete runs is the one exception, because the wait needs a face; it carries no jokes and no celebration.

Nothing playful near money, a refusal, or something destructive.

* Paywall, subscription, cancel, restore purchases, and any payment error.
* Delete-account and delete-data screens themselves (the confirmation, the result). Only the calm busy overlay while it runs.
* The age-blocked screen (the "not eligible" result). The age *question* is fine; the *no* is not.
* Legal, privacy and terms screens.

## Adding a spot

1. Add the name to `PipSpot` and an entry to `PIP_SPOTS` in `src/shared/mascot/pipSpots.ts`: a resting mood, a tap mood, and three short lines.
2. Pass it as `mascot="..."` to `EmptyState` or `GuestGateScreen`, or render `<PipFriend spot="..." />`.

Voice for lines: calm and concrete, one idea per line, no exclamation marks, no hype, never a guilt trip. `{name}` is replaced with the person's name, or "them" when there is none. A new line must be true: do not promise anything the app does not do.

## Sheets, fields and the tab bar

The phone's stock dialogs look nothing like the app, so choices are our own bottom sheets:

* `ActionSheet` (`src/shared/ui/ActionSheet.tsx`): a title, optional Pip above it, a list of choices with an icon and a quiet line each, and Cancel. Use it instead of `Alert.alert` for any choice with more than two options or any message that needs a next step. The chosen action runs about a quarter of a second after the sheet closes, so a native screen never opens while the sheet is still leaving. `onClose` says why it closed (`action` or `dismiss`).
* `PhotoSourceSheet` and `PhotoProblemSheet` (create feature) use it for "where is the photo?" and for a switched-off photo or camera permission, which offers **Open Settings**. The gallery (Android's Photo Picker) and the crop screen are the system's own and cannot be restyled; the crop screen is given the app's colours. A fully custom gallery would need broad photo-library permission, which the manifest deliberately avoids.
* `TextField` (`src/shared/ui/TextField.tsx`): the one text input for forms: label above, optional icon, coral ring when focused, red ring with the reason underneath when something is wrong, a clear button, and an eye button on passwords (`secret`). Passwords are never auto-capitalised or auto-corrected, whatever the caller passes.
* The tab bar (`FloatingTabBar`) is a floating pill. The current tab is a coral pill carrying its icon and name; the others are quiet icons. When you switch, the pill glides across and the tabs open and close around it (the maths is in `tabBarGeometry.ts`, tested to fill the bar exactly at every point of the move). Everything stays inside the bar, so it never covers content. The Vault tab shows a count while someone's birthday or anniversary is within 7 days (`countComingUp`). With Reduce Motion on, the pill fades across instead of gliding.

## The app icon

Pip is the app icon too: large, front-facing, on a flat amber field with a calendar-and-heart badge (concept C3). One drawing (`docs/store-assets/tools/icon-art.mjs`) produces every size, so never edit an icon file by hand:

```bash
scripts/generate-app-icons.sh
```

It redraws the layers in `assets/brand/` (full icon, Android foreground, monochrome silhouette, notification glyph) and writes the iOS set (opaque, no alpha), the Android adaptive, themed and notification icons, the store copies and the website favicon. Rebuild the native apps to see a change.

## Code

* `src/shared/mascot/pipSpots.ts`: spots, moods and lines (pure, no React).
* `src/shared/ui/Pip.tsx`: the drawing (moods `hopeful`, `joy`, `wink`, `cry`, `shocked`; optional blink).
* `src/shared/ui/PipFriend.tsx`: the interactive wrapper.
* `src/shared/ui/PipLoader.tsx`, `src/shared/ui/BusyOverlay.tsx`, `src/shared/mascot/busyLines.ts`: the waiting states.
* `src/shared/ui/SkeletonBone.tsx`: the shimmer block every skeleton layout is built from.
* Sign-in: `src/features/auth/application/useAuthFlow.ts` (Google, Apple and email in one place, shared by the Login tab and the guest sign-in sheet), `src/features/auth/ui/components/EmailAuthForm.tsx`, `AuthBackdrop.tsx` (a warm wash, no photo).
* Tests: `__tests__/shared/pipSpots.test.ts`, `__tests__/shared/pipFriend.test.tsx`, `__tests__/shared/busyLines.test.ts`, `__tests__/shared/busyOverlay.test.tsx`, plus the `mascot` cases in `__tests__/history/historyUi.test.tsx`. Any test that renders `EmptyState`, `GuestGateScreen` or `PipFriend` must mock `src/shared/platform/haptics`.
