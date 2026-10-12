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

## Code

* `src/shared/mascot/pipSpots.ts`: spots, moods and lines (pure, no React).
* `src/shared/ui/Pip.tsx`: the drawing (moods `hopeful`, `joy`, `wink`, `cry`, `shocked`; optional blink).
* `src/shared/ui/PipFriend.tsx`: the interactive wrapper.
* `src/shared/ui/PipLoader.tsx`, `src/shared/ui/BusyOverlay.tsx`, `src/shared/mascot/busyLines.ts`: the waiting states.
* `src/shared/ui/SkeletonBone.tsx`: the shimmer block every skeleton layout is built from.
* Tests: `__tests__/shared/pipSpots.test.ts`, `__tests__/shared/pipFriend.test.tsx`, `__tests__/shared/busyLines.test.ts`, `__tests__/shared/busyOverlay.test.tsx`, plus the `mascot` cases in `__tests__/history/historyUi.test.tsx`. Any test that renders `EmptyState`, `GuestGateScreen` or `PipFriend` must mock `src/shared/platform/haptics`.
