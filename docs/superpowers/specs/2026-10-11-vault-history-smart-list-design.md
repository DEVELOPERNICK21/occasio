# Vault + History: smart list (design)

Approved option 1: automatic ordering and grouping, no new controls.

## Vault

- `domain/vaultOccasion.ts`: `nextOccasionDays`, `groupVaultPeople` (pure).
- Sections, sorted by days until next occasion (ties by name), empty sections hidden:
  - This week: 0–7 days
  - This month: 8–30 days
  - Later: 31+ days
  - No date yet: no birthday or anniversary saved
- This week / This month: full `VaultPersonCard`.
- Later / No date yet: compact `VaultPersonRow` (name, next occasion, armed state, menu). Toggles live in person detail.
- "Needs review" heading above the existing scheduled-send inbox (the only loud item).
- Quick arm: for a person due within 7 days, on a plan that allows auto-send, with the next occasion not armed, the card shows one "Turn on auto-send for <Occasion>" button instead of two switches.
- Free plan: unchanged (switches stay disabled with the Pro note).

## History

- `domain/historyList.ts`: `sortHistoryEntries` puts active links first, expired last; order otherwise unchanged.
- Cards already lead with "Share again" (active) or "Make a new card" (expired). No UI change.

## Out of scope

Next-up hero card, filters, new navigation, data/API changes.
