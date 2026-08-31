---
title: Blueprint tracker (Phases 0–8)
description: Operating checklist for Occasio — status mapped to this docs site and the RN app.
phase: Meta
status: Living
updated: 2026-08-31
---

Use this as the master checklist. **Engineering work happens in the mobile app** (`src/`); docs-site records decisions and progress.

**Current focus (mobile):** Create — image picker + Firebase Functions for real share links.

See [Solo dev playbook](/docs/playbook) for the full phase map.

## Phase 0 — Discovery

- [x] Problem statement (who, pain, cost) — [Discovery 1-pager](/docs/discovery)
- [x] Competitors / gaps (initial table) — same page; deepen with named apps later
- [x] Core hypothesis — same page
- [x] Feasibility (tech, legal, budget) — same page
- [x] **Output locked** — Discovery signed off 2026-08-27

## Phase 1 — PRD

- [x] Overview / vision — [PRD](/docs/prd)
- [x] Goals & non-goals — PRD
- [x] Personas + JTBD — [Personas & MoSCoW](/docs/prd-personas-moscow)
- [x] User stories by epic (Must flows) — [User flows](/docs/user-flows)
- [x] MoSCoW — Personas & MoSCoW page
- [x] Success metrics — PRD + Personas page (add D7/D30 instrumentation in Phase 4)
- [x] Constraints — PRD/TRD (solo, RN CLI, India, store billing)
- [x] Product principles — [Principles](/docs/product-principles)
- [x] Target release date — Private beta **30 Nov 2026**; MVP soft launch **28 Feb 2027**

## Phase 2 — UX Flows

- [x] IA / screen inventory — [IA](/docs/ia)
- [x] Must-have flow diagrams + errors/empties — [User flows](/docs/user-flows)
- [x] Low-fidelity wireframes — [Wireframes](/docs/wireframes)
- [ ] Usability pass (3–5 people) — [Script](/docs/usability) *(optional in parallel)*

## Phase 2.5 — UI Design in Stitch

- [x] Design tokens defined — [`design-tokens.json`](/docs/design-tokens) + RN mirror
- [x] UI design principles — [UI design principles](/docs/ui-design-principles)
- [ ] Screen-by-screen from wireframes (Stitch — you)
- [ ] Multi-screen consistency pass
- [ ] Export → Figma polish
- [x] Lock `design-tokens.json`
- [ ] Export code as visual reference only

## Phase 3 — TRD + Architecture setup

- [x] Architecture overview — [TRD](/docs/trd)
- [x] Tech stack + rationale — TRD (RN **CLI**, not Expo)
- [x] Client architecture — [Architecture](/docs/architecture)
- [x] Data model (high-level) — TRD
- [x] API / Functions contracts — [API contracts](/docs/api-contracts)
- [x] Environment strategy — [Env strategy](/docs/env-strategy)
- [x] Repo folder structure + CI + PR template — `src/features/`, `.github/`
- [x] NFR targets — [NFR](/docs/nfr)
- [x] ESLint layer boundaries — `.eslintrc.js`
- [x] AI IDE rules — `AGENTS.md` + `.cursor/rules/`
- [x] `.env.example` — secrets pattern
- [x] Data flow & network guide — [Data flow](/docs/data-flow)

## Phase 4 — Feature-by-feature build

Build order: **create → recipient → auth/vault/history → billing → auto-send engine**

### Create (in progress)

- [x] Mini-PRD — [Create blueprint](/docs/create-blueprint)
- [x] Screens scaffold + domain draft hook
- [x] `data/` — `creationRepository`, `uploadService` via `httpClient`
- [x] `shared/api/httpClient` + `shared/firebase` + emulator-aware `env`
- [x] Cloud Functions source (`functions/` — `POST /v1/creations`, `GET /v1/cards/:slug`)
- [x] Firebase RN init (`@react-native-firebase/app`, google-services / plist)
- [x] `domain/quota.ts`, `creationRules.ts` + unit tests
- [x] `useCreateShareLink` → Preview → ShareSuccess with real URL shape
- [ ] Image picker + upload bytes to storage
- [ ] Firebase Functions **deployed** to `occasio-app-dev` (source ready; run `npm run firebase:deploy`)
- [ ] Analytics events wired
- [ ] Paywall modal UI
- [ ] All acceptance criteria met

### Other features

- [ ] recipient (web)
- [ ] auth + vault + history
- [ ] billing
- [ ] auto-send engine

## Phase 5 — Security

- [ ] Firebase Auth + secure token storage (Keychain/Keystore)
- [ ] TLS; no secrets in client bundle
- [ ] DPDP + Play Data Safety + Apple Privacy aligned to real data
- [ ] Delete person / delete account
- [ ] Dependabot / npm audit in CI

## Phase 6 — QA

- [ ] Unit tests on domain rules
- [ ] Integration on data/Functions contracts
- [ ] E2E on critical flows only
- [ ] Device matrix + permission denial
- [ ] TestFlight / Play internal testing

## Phase 6.5 — Store screenshots (Stitch)

- [ ] Screenshot sets from **shipped** screens only
- [ ] Listing copy
- [ ] No feature claims ahead of build

## Phase 7 — Release

- [ ] CI/CD (Fastlane for RN CLI)
- [ ] Store privacy forms
- [ ] Staged rollout + rollback (feature-flag auto-send dispatch)

## Phase 7.5 — Jules maintenance

- [ ] Connect Jules to GitHub for bounded chores only
- [ ] Human review every PR

## Phase 8 — Monitor + learn

- [ ] Crashlytics/Sentry
- [ ] Analytics mapped to PRD metrics (`card_shared`, `vault_person_added`, `autosend_*`, `subscribe_success`, …)
- [ ] Cadence review vs PRD goals

---

## Success checklist

- [x] Real problem validated (Phase 0 not skipped)
- [ ] Narrow v1 respected (non-goals held)
- [ ] Store listing matches shipped app
- [ ] Crashes + retention watched from day 1
- [ ] Maintenance owner assigned (you ± Jules for chores)
