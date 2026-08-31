# AGENTS.md — Occasio (solo dev + AI IDE)

**Read this file before any product work.** Do not guess architecture or UI.

## Product

**Occasio** = React Native mobile app (primary). `docs-site/` = specs only.

## Mandatory reads (in order)

| # | File | Why |
|---|---|---|
| 1 | [`ARCHITECTURE.md`](./ARCHITECTURE.md) | Repo map, layers, build order |
| 2 | [`docs-site/content/ui-design-principles.md`](./docs-site/content/ui-design-principles.md) | **UI tokens, components, consistency** |
| 3 | [`docs-site/content/data-flow.md`](./docs-site/content/data-flow.md) | **Data flow, API, network patterns** |
| 4 | [`docs-site/content/blueprint.md`](./docs-site/content/blueprint.md) | Phase + current focus |
| 5 | Active feature blueprint (e.g. [`create-blueprint.md`](./docs-site/content/create-blueprint.md)) | Acceptance criteria |

Then consult as needed: `api-contracts.md`, `trd.md`, `prd.md`, `wireframes.md`, `design-tokens.json`.

## Decision tree (don't work blindly)

```
User asks for UI change?
  → ui-design-principles.md + wireframes.md
  → Use Screen, Button, tokens.ts only
  → No fetch/Firebase in screens

User asks for API / data / Firebase?
  → data-flow.md + api-contracts.md
  → Code in features/<x>/data/
  → Orchestrate via application/ hooks
  → Domain rules in domain/ (pure, tested)

User asks for new feature?
  → Check blueprint phase + create feature blueprint pattern
  → New folder: src/features/<name>/{ui,application,domain,data}
  → Update api-contracts.md if new endpoints

User asks for docs-site change?
  → Specs/landing only — NOT product UI (see surfaces.md)
```

## Architecture (summary)

```
src/features/<feature>/
  ui/            → screens (RN only)
  application/   → hooks — loading, errors, orchestration
  domain/        → pure rules & types (no IO)
  data/          → fetch, Firestore, upload (no React)
```

**Dependency rules:** ui ↛ data directly · data ↛ ui · domain ↛ everything external

**TypeScript:** `strict: true` · no `any` in `domain/`

## UI consistency

- Tokens: `design-tokens.json` → `src/shared/theme/tokens.ts`
- Shared components: `src/shared/ui/` (Screen, Button, …)
- One primary CTA per screen · calm trust aesthetic
- Mobile + recipient web share tokens; docs-site is separate

Full rules: `ui-design-principles.md`

## Data & network

- All HTTP in `data/` repositories · typed errors
- Hooks in `application/` call domain then data
- Mock via `env.useMockApi` when you need offline dev; otherwise Functions (emulator or cloud)
- API base: `getApiBaseUrl()` → `...cloudfunctions.net/api` (note `/api` prefix from function export name)
- No base64 images in Firestore

Full patterns: `data-flow.md` · schemas: `api-contracts.md`

## Current focus

**Phase 4 — Create:** image picker, real upload, Functions, paywall modal.

Build order: create → recipient web → auth/vault/history → billing → auto-send.

## What NOT to do

- Build product UI in `docs-site/`
- `fetch` or Firebase in `ui/`
- Hardcoded colors outside `tokens.ts`
- Expo (RN CLI project)
- Store billing bypass for digital goods
- Commit secrets or create git commits unless asked
- Over-engineer (no microservices, no repo-per-layer packages)

## Verify

```sh
npx tsc --noEmit
npm start && npm run android
```

## Cursor rules (auto-loaded)

`.cursor/rules/occasio.mdc` · `ui-design.mdc` · `data-network.mdc` · `mobile-features.mdc` · `create-feature.mdc` · `docs-site.mdc`
