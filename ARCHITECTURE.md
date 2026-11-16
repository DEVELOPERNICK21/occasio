# Occasio — repository map (mobile-first)

**Occasio is a React Native mobile app.** Everything else in this repo supports it.

## Solo dev + AI IDE

| File | Purpose |
|---|---|
| [`AGENTS.md`](./AGENTS.md) | Master instructions for AI agents |
| [`.cursor/rules/`](./.cursor/rules/) | Cursor rules (auto-applied in Cursor) |
| This file | Repo map & layer rules |

## What is the product?

| Surface | Role | Priority |
|---|---|---|
| **Mobile app** (`src/`, `App.tsx`, `android/`, `ios/`) | **The product** — create, vault, billing, push, auto-send UX | **Primary** |
| **Backend** (`functions/`, `firebase.json`, `firestore.rules`) | Auth, Firestore, Cloud Functions API (`api` export) | **Primary** (server) |
| **docs-site** (`docs-site/`) | Landing, PRD/TRD, blueprint, IA — **documentation only** | Secondary |
| **Recipient web** (`docs-site/src/app/c/[slug]`) | Public card view at share URL | Phase 4 slice |

The Next.js docs site is **not** the creator app. Do not build product features there except a future marketing landing + optional public `/c/[slug]` recipient page.

## Where code lives

```
Occasio/                          ← you are here (RN app = main)
├── App.tsx
├── src/
│   ├── app/                      ← APP SHELL: navigators, tabs, startup wiring (may know every feature)
│   ├── features/                 ← product features: age, auth, account, billing, create,
│   │   │                            history, vault, onboarding, widgets
│   │   │                            (create also holds the frames, invitations, festivals and badges:
│   │   │                            the largest feature, see docs/architecture-audit.md)
│   │   └── create/               ← each feature has the same four layers
│   │       ├── domain/           ← pure rules & types
│   │       ├── application/      ← hooks, use-cases
│   │       ├── data/             ← Firebase, upload APIs, adapters
│   │       └── ui/               ← screens
│   └── shared/                   ← below every feature; imports none
│       ├── api/                  ← httpClient + the one list of API error codes
│       ├── config/               ← env, API base URL, emulator flags
│       ├── firebase/             ← RN Firebase app helpers
│       ├── navigation/           ← route types, tab-bar parts (the navigators live in src/app)
│       ├── platform/             ← haptics, runtime, reduce-motion
│       ├── theme/                ← mirrors design-tokens.json
│       └── ui/
├── scripts/architecture/         ← the dependency checker + features.json (who may import whom)
├── functions/                    ← Cloud Functions (Express `api` export)
├── design-tokens.json            ← Stitch + RN
├── android/  ios/
│
├── docs-site/                    ← docs & landing only (Next.js)
│   └── content/                  ← PRD, TRD, blueprint markdown
│
└── docs/prd-trd.md               ← legacy export; edit docs-site/content/
```

## Solo dev + AI IDE

| File | Purpose |
|---|---|
| [`AGENTS.md`](./AGENTS.md) | **Start here for AI** — decision tree, mandatory reads |
| [`.cursor/rules/`](./.cursor/rules/) | Auto-enforced: UI, data flow, layers |
| [`docs-site/content/ui-design-principles.md`](./docs-site/content/ui-design-principles.md) | UI consistency (mobile + web) |
| [`docs-site/content/data-flow.md`](./docs-site/content/data-flow.md) | API, network, layer flow |

## Architecture rules (mobile app)

1. **Feature-based folders** under `src/features/<name>/`
2. **Layers:** `ui` → `application` → `domain` ← `data`
3. **UI never imports** `data`, Firebase / RevenueCat SDKs, or calls `fetch`
4. **`data` never imports** React, UI or application; **`domain`** is pure (no packages, no `any`)
5. **Features import each other only as `scripts/architecture/features.json` allows**, and only `application` / `domain`, never another feature's `ui` or `data`
6. **`shared` imports no feature; features never import `src/app`.** Anything that must know several features (navigators, startup wiring) lives in `src/app`
7. **One source of truth** per fact: colours in `shared/theme/tokens.ts`, the tier in `billing/domain`, API error codes in `shared/api/errors.ts`
8. **Strict TypeScript** (`tsconfig` strict)
9. **State:** Firestore listeners behind application hooks, React context for the create wizard, providers for session and plan

**Enforced:** `npm run arch:check` (also runs in `npm test`). Full detail: [docs-site → Client architecture](docs-site/content/architecture.md) · audit: [`docs/architecture-audit.md`](docs/architecture-audit.md).

## Build order (mobile)

1. **Foundation hardening** — ESLint boundaries, Firebase dev project, `create/data/`
2. **Create** — real upload + share link (validates demand) ✅
3. **Recipient web** — thin public card page ✅
4. **Auth + Vault + History** ✅
5. **Billing (RevenueCat)** — **Shipaton blocker** → [billing-blueprint.md](docs-site/content/billing-blueprint.md)
6. **Shipaton submit** — production store + Devpost → [shipaton-blueprint.md](docs-site/content/shipaton-blueprint.md)
7. **Auto-send engine** — cron + review + mock dispatch shipped (`OCCASIO_AUTOSEND_DISPATCH=false` default); E2E + real providers next → [vault-blueprint.md](docs-site/content/vault-blueprint.md)

## Run the app (main workflow)

```sh
npm start
npm run android    # or npm run ios
```

### Local API (Firebase emulators)

```sh
npm run functions:serve   # Functions + Firestore emulators (port 5001 / 8080)
```

In `__DEV__`, the app uses `useFunctionsEmulator: true` by default — API calls go to the emulator (`10.0.2.2` on Android, `127.0.0.1` on iOS simulator). Set `env.useMockApi = true` in `src/shared/config/env.ts` to skip network entirely.

Deploy to cloud: `npm run firebase:deploy`

## Docs site (reference only)

```sh
cd docs-site && npm run dev
```

Deploy docs when you want a public landing — not required to ship the mobile app.

## What’s done vs not (mobile)

| Done | Not yet (Shipaton path) |
|---|---|
| Create flow + Spark upload + share link | Play/App Store **production** (US) |
| Auth, Vault, History + template MVP | Devpost submission assets |
| Recipient web `/c/[slug]` | Sandbox purchase verified on device |
| RevenueCat billing client + paywall UI + tier mirror | Production `goog_` / `appl_` keys |
| Auto-send engine (cron, review UX, mock dispatch, FCM) | E2E verification (Task 11); real WA/SMS/email providers |
| Domain unit tests (create, vault, auth, history, billing, functions autosend) | Production dispatch (`OCCASIO_AUTOSEND_DISPATCH=true`) |
| Invitations, festivals and holidays, wishes left and badges, clear purchase messages | Redeploy docs-site so the recipient pages and previews go live |
| WhatsApp delivery through Meta's Cloud API (built, off by default) | Meta account, approved template, token, webhook; deploy Functions and rules |

**Next:** Device-verify RC purchase (Account → See Occasio Pro) → production store → Devpost by **30 Sep 2026**. Then Task 11 E2E auto-send on emulator/device. Plan: `docs/superpowers/plans/2026-09-12-shipaton-sprint.md`.
