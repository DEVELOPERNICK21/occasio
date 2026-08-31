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
│   ├── features/                 ← product features (auth, create, vault, …)
│   │   └── create/               ← in progress
│   │       ├── domain/           ← pure rules & types
│   │       ├── application/      ← hooks, use-cases
│   │       ├── data/             ← Firebase, upload APIs (next)
│   │       └── ui/               ← screens
│   └── shared/
│       ├── api/                  ← httpClient (typed HTTP for all repositories)
│       ├── config/               ← env, API base URL, emulator flags
│       ├── firebase/             ← RN Firebase app helpers
│       ├── navigation/
│       ├── theme/                ← mirrors design-tokens.json
│       └── ui/
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
3. **UI never imports** Firebase / RevenueCat SDKs directly
4. **`data` never imports** React components
5. **Features don't import** other features' `ui`
6. **Strict TypeScript** (`tsconfig` strict)
7. **State:** remote (query/Firestore) vs flow (create wizard context / Zustand)

Full detail: [docs-site → Client architecture](docs-site/content/architecture.md) (browse via `npm run dev` in `docs-site`).

## Build order (mobile)

1. **Foundation hardening** — ESLint boundaries, Firebase dev project, `create/data/`
2. **Create** — real upload + share link (validates demand)
3. **Recipient web** — thin public card page (share URL)
4. **Auth + Vault + History**
5. **Billing** (RevenueCat)
6. **Auto-send** (Functions + review window in app)

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

| Done | Not yet |
|---|---|
| Feature folder structure + ESLint boundaries | Real image picker + R2 upload |
| Create UI scaffold (5 screens) | Auth, Vault, Billing |
| Tab navigation shell | Auto-send backend |
| Design tokens in RN | Functions deployed to cloud |
| `httpClient` + Firebase RN init | RevenueCat |
| Cloud Functions source (`POST /v1/creations`, `GET /v1/cards/:slug`) | Presign upload (501 stub) |

Next engineering slice: **deploy Functions + image picker + presign upload.**
