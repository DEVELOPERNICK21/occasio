---
title: Client architecture
description: Occasio mobile app — feature modules, layers, dependency rules, single sources of truth, and how they are enforced.
phase: Phase 3 — Technical
status: Agreed
updated: 2026-10-15
---

> **Scope:** This document describes the **React Native app** (`src/`). The [docs-site](/docs/surfaces) is documentation/landing only — not the product codebase.

**Agents:** UI rules → [UI design principles](/docs/ui-design-principles). Data/API → [Data flow & network](/docs/data-flow).

## Approach

**Feature-based + pragmatic Clean Architecture + strict TypeScript + enforced dependency boundaries.**

Applied pragmatically for a small team — **not** a full ports-and-adapters monorepo. Three ideas carry it:

1. **Feature-based:** code is grouped by what the product does (`create`, `vault`, `billing`…), not by kind of file.
2. **Clean layering:** inside a feature, dependencies point one way, toward pure rules.
3. **Control:** what may depend on what is written down in one file and checked on every `npm test`.

## The shape of `src/`

```
App.tsx                  entry: providers, startup wiring
src/
  app/                   THE APP SHELL (composition root): navigators, tabs, startup wiring.
                         The only place that may know several features at once.
  features/<name>/
    ui/                  screens and components (React Native)
    application/         hooks and use-cases: orchestrate domain + data
    domain/              types and pure rules (no React, no SDKs, no I/O)
    data/                repositories and adapters: Firebase, HTTP, RevenueCat, storage, audio
  shared/                design tokens, UI primitives, HTTP client, config, platform helpers
```

Reading order of a request: `ui → application → domain` and `application → data`. `domain` imports nothing but other domain and pure constants.

## Feature modules

| Feature | Owns |
|---|---|
| `age` | Date-of-birth gate, the server age check, stamping accounts |
| `auth` | Sign-in (Google, Apple, email), session, soft sign-in gate, password reset |
| `account` | The signed-in account screen: profile, plan, restore, sign out, delete |
| `billing` | Plans, store purchase, the subscription tier (`SubscriptionTier`), entitlements |
| `create` | Wizard: who/occasion/template/photos/details/preview/share; templates; quota; paywall trigger |
| `history` | Created cards: list, detail, re-share, record, guest queue |
| `vault` | People and dates, auto-send settings, review window, FCM registration |
| `onboarding` | First-run flow that hands off into create |
| `widgets` | Home-screen widget data and host |

The public card view is a **thin web page** (share URL), not a mobile feature — see [Product surfaces](/docs/surfaces).

## Dependency rules

Checked by `npm run arch:check`, which also runs inside `npm test` (`__tests__/architecture/layering.test.ts`). ESLint repeats the common ones while you type.

**Inside a feature**

1. **UI** may use `application` and `domain`. It never imports `data`, an SDK (Firebase, RevenueCat, Google/Apple sign-in, storage) or calls `fetch`.
2. **Application** never imports UI.
3. **Data** never imports React, React Native, view libraries, UI or application. Device and billing SDKs (`react-native-purchases`, `react-native-sound`…) are fine here.
4. **Domain** is pure: no packages at all, no `any`, and it imports only other domain files and pure shared constants (`shared/config/media.ts`).

**Between features**

5. **A feature may import another feature only if `scripts/architecture/features.json` allows it** — and then only its `application` or `domain`, never its `ui` or `data`. What two features share goes down into `shared/` (UI) or up into the app shell (wiring).
6. **No loops.** The declared map must be acyclic; the one deliberate exception is listed under `mutual` with its reason (`create` ↔ `history`). Features' `domain` layers, and their `data` layers, must never loop at all.
7. **A declared dependency nothing uses fails the check**, so the map stays true.

**Between layers of the repo**

8. **`shared` imports no feature and not `src/app`.**
9. **A feature never imports `src/app`.** The shell imports features; never the reverse.
10. **Colours come from `shared/theme/tokens.ts`.** The exceptions (mascot artwork, template palettes, celebration effects, Google's logo) are named in `scripts/architecture/rules.js`.

## Single sources of truth

One place for each fact. If you need it elsewhere, import it.

| Fact | Lives in |
|---|---|
| Which features may depend on which | `scripts/architecture/features.json` |
| Colours, spacing, radius, dims | `src/shared/theme/tokens.ts` (mirrors `design-tokens.json`) |
| The subscription tier type | `features/billing/domain/types.ts` |
| API error codes (type and runtime check) | `HTTP_ERROR_CODES` in `shared/api/errors.ts`; narrower sets use `Extract<HttpErrorCode, …>` |
| Card-type display names | `templateLabel` in `features/create/domain/templates.ts` |
| Audience colours and icons | `shared/ui/audienceStyle.ts` |
| Quota and link lifetimes | `features/create/domain/quota.ts`, `shareLink.ts` (mirrors the server: see `api-contracts.md`) |
| What the API answers and accepts | [API contracts](/docs/api-contracts) |

## The app shell (`src/app`)

Anything that has to know about more than one feature lives here, so features stay independent:

- **Navigators and tabs** (`navigation/`): which screen goes where. `AccountTab` chooses between the login screen and the account.
- **Startup wiring** (`accountGates.ts`): plugs the age check into account creation. Auth only knows a `NewAccountGate` port; with no gate installed a new account is refused and deleted, never kept.
- **Reactions to sign-in** (`SessionEffects.tsx`): saves guest cards to history and stamps older accounts, so auth never imports history or age.

## Doing common things

- **A feature needs something from another feature:** use its `application` hook or `domain` type, add the edge to `features.json`, and run `npm run arch:check`. If it is UI that both need, move it to `shared/ui`.
- **Two features need to react to each other:** wire it in `src/app`, with a port (a small type the lower feature defines) if one feature should not know the other.
- **A new feature:** add `src/features/<name>/{ui,application,domain,data}` and its entry in `features.json`.
- **Moving files:** `node scripts/architecture/move.js <from> <to>` rewrites every import, including `jest.mock` paths. Then `npm run typecheck && npm test`.

## State

| Kind | What the app does today |
|---|---|
| Remote | Firestore listeners and repositories behind `application` hooks (`useHistory`, `useVaultPeople`) |
| Flow UI | React context plus hooks (`CreateDraftContext` for the create wizard) |
| Session and plan | Providers at the root: `AuthProvider`, `BillingProvider` |

No external state library is used. Adopt one (for example a query cache) only when a real problem calls for it, and keep it behind `application`. Do **not** put all app state into one global store.

## Out of MVP

- Separate npm packages per layer
- Shared monorepo domain with docs-site
- Repository interfaces for every collection “just in case”

System/backend: [TRD](/docs/trd) · Repo map: [Surfaces](/docs/surfaces) · Root: `ARCHITECTURE.md` · Audit: `docs/architecture-audit.md`
