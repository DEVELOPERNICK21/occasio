---
title: Blueprint tracker (Phases 0–8)
description: Operating checklist for Occasio — status mapped to this docs site and the RN app.
phase: Meta
status: Living
updated: 2026-09-13
---

Use this as the master checklist. **Engineering work happens in the mobile app** (`src/`); docs-site records decisions and progress.

**Current focus (mobile):** **Shipaton 2026** — verify RevenueCat purchase → Play production (US) → Devpost by **30 Sep 2026**. Auto-send **engine** shipped (mock dispatch; `OCCASIO_AUTOSEND_DISPATCH=false` default) — E2E verification pending (Task 11). Plan: repo `docs/superpowers/plans/2026-09-12-shipaton-sprint.md`. See [Shipaton blueprint](/docs/shipaton-blueprint) · [Billing blueprint](/docs/billing-blueprint) · [Vault blueprint](/docs/vault-blueprint).

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

### Create

- [x] Mini-PRD — [Create blueprint](/docs/create-blueprint)
- [x] Screens scaffold + domain draft hook
- [x] `data/` — `creationRepository`, `uploadService` via `httpClient`
- [x] `shared/api/httpClient` + `shared/firebase` + emulator-aware `env`
- [x] Cloud Functions source (`functions/` — `POST /v1/creations`, `GET /v1/cards/:slug`)
- [x] Firebase RN init (`@react-native-firebase/app`, google-services / plist)
- [x] `domain/quota.ts`, `creationRules.ts` + unit tests
- [x] `useCreateShareLink` → Preview → ShareSuccess with real URL shape
- [x] Image picker + base64 upload (Spark interim)
- [x] Vercel API `POST /api/v1/creations` deployed (Spark path)
- [x] Analytics stub events
- [x] Paywall modal UI
- [x] Create acceptance criteria met (vault deferred → auth)
- [x] **Template system MVP** — [Template system blueprint](/docs/template-system-blueprint) (Who → Occasion → recommend, 5 layouts, Quick Create)

### Recipient (web — in progress)

- [x] Mini-PRD — [Recipient blueprint](/docs/recipient-blueprint)
- [x] `/c/[slug]` card view (Firestore Admin)
- [x] Expired + not-found pages
- [x] Dynamic OG images for link previews
- [ ] Multi-photo carousel (Blaze + Storage)
- [ ] `card_viewed` analytics

### Auth (done)

- [x] Mini-PRD — [Auth blueprint](/docs/auth-blueprint)
- [x] `features/auth/` layers (domain → data → application → ui)
- [x] Soft-auth modal (Google + Email)
- [x] Account tab + guest gates on Vault/History
- [x] Share success → Save to Vault triggers soft auth
- [x] Device tested: sign-in on Android
- [ ] Device tested: sign-in on iOS

### Vault (mostly done)

- [x] Mini-PRD — [Vault blueprint](/docs/vault-blueprint)
- [x] `relationships` Firestore CRUD (client, rules in place)
- [x] Vault list + Add person screens
- [x] Share success → prefilled Add person
- [x] Person detail + delete
- [x] Anniversary + auto-send pack + link creation (“Save for auto-send”)
- [x] Scheduled send inbox + review screen + FCM registration
- [ ] Paid tier caps from RevenueCat (client mirror live; webhook optional)

### History (done)

- [x] Mini-PRD — [History blueprint](/docs/history-blueprint)
- [x] `user_creations` index + Firestore rules
- [x] History list + detail (reshare)
- [x] Auto-record on Share success when signed in
- [x] Link guest creations on sign-in (local queue → sync)
- [x] Deploy Firestore rules

### Billing (RevenueCat — Shipaton blocker)

Mini-PRD: [Billing blueprint](/docs/billing-blueprint)

- [ ] RevenueCat project + Play / App Store apps connected
- [ ] `src/features/billing/` — domain → data → application → ui
- [ ] Install `react-native-purchases`; SDK keys in env (public keys only)
- [ ] Store products: Personal (+ Family optional v1) monthly/yearly
- [ ] Wire `PaywallModal` → real purchase flow
- [ ] `useSubscription().tier` → Vault caps + create quota + auto-send gate
- [ ] Restore purchases on Account
- [ ] `POST /v1/webhooks/revenuecat` in Functions (mirror tier to Firestore)
- [ ] Domain tests: entitlement → tier mapping
- [ ] Sandbox purchase tested Android; iOS purchase tested
- [ ] Judge promo code or free trial documented for Devpost

### Auto-send engine

- [x] Scheduled dispatch (Functions cron `POST /v1/internal/autosend/run` + `autosendDaily` 06:00 IST)
- [x] `scheduled_sends` collection + idempotency + paid tier gate (`users.subscriptionTier`)
- [x] Review window UX in app (approve / cancel + share sheet)
- [x] Mock WhatsApp → SMS → email fallback queue (`OCCASIO_AUTOSEND_DISPATCH` gated)
- [x] FCM `autosend_review` / `autosend_sent` + token registration
- [x] Firestore rules + API contracts documented
- [ ] E2E verified on emulator/device (Task 11)
- [ ] Real delivery providers + production dispatch flag on

## Phase 4.5 — Shipaton 2026 (deadline 30 Sep 2026)

Full checklist: [Shipaton blueprint](/docs/shipaton-blueprint)

### Eligibility (RevenueCat rules)

- [ ] First **public** store release between **1 Aug – 30 Sep 2026**
- [ ] RevenueCat SDK powers ≥1 in-app purchase
- [ ] App available in **United States** on Play and/or App Store
- [ ] Registered on [Devpost — Shipaton 2026](https://revenuecat-shipaton-2026.devpost.com/)

### Engineering before submit

- [x] Core create + share + recipient web
- [x] Auth, Vault, History
- [x] Landing page + beta link + contact email
- [ ] RevenueCat integrated (see Billing above)
- [ ] Production Play listing (internal test alone is not enough)
- [ ] iOS auth + billing smoke test
- [ ] Play App Signing SHA-1 in Firebase (auth on Play builds)

### Devpost deliverables

- [ ] English description + tagline
- [ ] Public store URL
- [ ] Demo video ≤2 min (YouTube/Vimeo, public)
- [ ] 1024×1024 app icon
- [ ] 1179×2556 screenshot(s), no device frame
- [ ] RevenueCat Project ID on form
- [ ] Promo code or trial so judges unlock premium
- [ ] Final submit before **30 Sep 2026, 11:45pm PDT**

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
