# AGENTS.md — Occasio (solo dev + AI IDE)

Instructions for AI agents (Cursor, etc.) working on this repository.

## Product

**Occasio** is a React Native mobile app (India-first): save people once, auto-send personalized digital wishes on the right day.

| Surface | Path | Build here? |
|---|---|---|
| **Mobile app (product)** | `src/`, `App.tsx`, `android/`, `ios/` | **Yes — primary** |
| **Backend** | Firebase + Cloud Functions (future `functions/`) | Server only |
| **docs-site** | `docs-site/` | Specs + optional landing — **not** creator UI |
| **Recipient web** | Thin `/c/[slug]` page later | Public card view only |

## Read first (in order)

1. [`ARCHITECTURE.md`](./ARCHITECTURE.md) — repo map, layers, build order
2. [`docs-site/content/blueprint.md`](./docs-site/content/blueprint.md) — phase checklist, current focus
3. [`docs-site/content/create-blueprint.md`](./docs-site/content/create-blueprint.md) — active feature slice
4. [`.cursor/rules/`](./.cursor/rules/) — enforced conventions (auto-loaded in Cursor)

## Specs (reference — do not duplicate in code comments)

| Topic | File |
|---|---|
| Product requirements | `docs-site/content/prd.md` |
| Technical / backend | `docs-site/content/trd.md` |
| Client layers | `docs-site/content/architecture.md` |
| Surfaces (mobile vs docs) | `docs-site/content/surfaces.md` |
| API contracts | `docs-site/content/api-contracts.md` |
| Env / secrets | `docs-site/content/env-strategy.md` |
| NFRs | `docs-site/content/nfr.md` |
| UX / wireframes | `docs-site/content/wireframes.md`, `ia.md`, `user-flows.md` |
| Design tokens | `design-tokens.json` → `src/shared/theme/tokens.ts` |
| Principles | `docs-site/content/product-principles.md` |
| Phase pipeline (easy reference) | `docs-site/content/playbook.md` |

Browse specs: `cd docs-site && npm run dev` → http://localhost:3000

## Mobile architecture (mandatory)

```
src/features/<feature>/
  ui/            → screens, components (RN only)
  application/   → hooks, orchestration
  domain/        → types, pure rules (no React, no Firebase)
  data/          → API, Firestore, upload adapters
```

**Dependency rules:**
- `ui` → `application`, `domain` only (never Firebase/RevenueCat in screens)
- `data` → `domain` only (never import React or `ui`)
- No feature imports another feature's `ui`
- Cross-feature: shared types in `domain` or `src/shared/`

**TypeScript:** `strict: true` — no `any` in `domain/`.

## Current engineering focus

**Phase 4 — Create feature** (in progress):

- Done: UI scaffold, navigation, draft context, domain types
- Next: `src/features/create/data/` — upload + `POST /v1/creations` + real share URL
- Then: image picker, quota/paywall domain, share sheet

Build order after create: recipient web → auth/vault/history → billing → auto-send.

## What NOT to do

- Do not build creator/vault/billing UI in `docs-site/`
- Do not store images as base64 in Firestore
- Do not skip store billing for digital subscriptions (Play / App Store)
- Do not add Expo — project uses **React Native CLI**
- Do not commit secrets (`.env*`, API keys, R2 credentials)
- Do not create git commits unless the user asks
- Do not over-engineer (no repository interfaces for every collection on day one)

## Run / verify

```sh
# Mobile (primary)
npm start
npm run android   # or npm run ios

# Typecheck
npx tsc --noEmit

# Docs site (secondary)
cd docs-site && npm run dev
```

## When starting a task

1. Check `blueprint.md` for phase
2. Check feature blueprint (e.g. `create-blueprint.md`) for acceptance criteria
3. Edit `src/features/` for product work
4. Update `docs-site/content/` only when specs or contracts change
5. Update `blueprint.md` checkbox when a slice ships

## Solo dev workflow

- Small focused PRs / commits per feature slice
- One feature blueprint before coding
- Mobile ships first; docs-site tracks decisions
- Usability/Stitch can run in parallel — visuals don't block `data/` layer
