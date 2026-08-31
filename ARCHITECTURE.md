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
| **Backend** (Firebase + Cloud Functions, not in repo yet) | Auth, Firestore, share links, auto-send engine | **Primary** (server) |
| **docs-site** (`docs-site/`) | Landing, PRD/TRD, blueprint, IA — **documentation only** | Secondary |
| **Recipient web** (future) | Public card view at share URL — minimal Next.js route or separate deploy | Phase 4 slice |

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
│       ├── navigation/
│       ├── theme/                ← mirrors design-tokens.json
│       └── ui/
├── design-tokens.json            ← Stitch + RN
├── android/  ios/
│
├── docs-site/                    ← docs & landing only (Next.js)
│   └── content/                  ← PRD, TRD, blueprint markdown
│
└── docs/prd-trd.md               ← legacy export; edit docs-site/content/
```

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

## Docs site (reference only)

```sh
cd docs-site && npm run dev
```

Deploy docs when you want a public landing — not required to ship the mobile app.

## What’s done vs not (mobile)

| Done | Not yet |
|---|---|
| Feature folder structure | ESLint boundary enforcement |
| Create UI scaffold (5 screens) | Firebase / Functions |
| Tab navigation shell | Real image picker + upload |
| Design tokens in RN | Auth, Vault, Billing |
| Strict TS | Auto-send backend |

Next engineering slice: **foundation hardening + `create/data/` upload + share API.**
