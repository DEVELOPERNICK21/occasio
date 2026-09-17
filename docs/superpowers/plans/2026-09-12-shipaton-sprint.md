# Shipaton 2026 Sprint Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Qualify Occasio for RevenueCat Shipaton 2026 (store + RC IAP + Devpost) without building the auto-send engine.

**Architecture:** Existing `features/billing/` stays the only RevenueCat boundary. UI uses `usePaywall` / `useSubscription`. Store listing and Devpost are human console work guided by checklists.

**Tech Stack:** React Native CLI, `react-native-purchases`, `react-native-purchases-ui`, Google Play / App Store Connect, RevenueCat dashboard, Devpost.

## Global Constraints

- Deadline: **30 Sep 2026, 11:45pm PDT**
- First public store release window: **1 Aug – 30 Sep 2026**
- App must be available in the **United States**
- RevenueCat SDK must power ≥1 IAP
- No auto-send delivery claims in store listing or demo until engine ships
- UI never imports RevenueCat SDK (only `billing/data/`)
- Do not commit secrets / real production keys into git if user pastes them — use local `revenueCat.ts` / env only as already patterned

---

### Task 1: Device verify billing (Track 1)

**Files:**
- Reference: `docs/REVENUECAT_SETUP.md`
- Reference: `src/shared/config/revenueCat.ts`
- Reference: `src/features/auth/ui/screens/AccountScreen.tsx`

**Interfaces:**
- Consumes: Test Store key / offerings with entitlement `occasio_pro`
- Produces: Written pass/fail notes for purchase, restore, Vault unlock

- [ ] **Step 1:** Confirm RevenueCat dashboard — entitlement `occasio_pro`, Current offering with monthly/yearly/lifetime, Paywall + Customer Center templates published
- [ ] **Step 2:** Rebuild app (`yarn android` or `yarn ios`) so purchases UI is linked
- [ ] **Step 3:** Sign in → Account → **See Occasio Pro** → complete Test Store purchase → badge shows **OCCASIO PRO**
- [ ] **Step 4:** Vault → add 2nd person and/or enable auto-send toggle (paid gate) — proves entitlement wiring
- [ ] **Step 5:** Account → **Restore purchases** on a fresh install / after clear (optional) → Pro returns
- [ ] **Step 6:** If any step fails, fix code in `billing/` or dashboard config before Track 2

---

### Task 2: Harden listing honesty (Track 1 polish)

**Files:**
- Modify: `src/features/create/ui/components/PaywallModal.tsx` (if still shown anywhere)
- Modify: `src/features/auth/domain/accountProfile.ts` only if copy claims auto-send delivery
- Modify: docs-site landing / store listing drafts as needed

**Interfaces:**
- Produces: Copy that mentions Vault / unlimited cards / year-long links — not yearly auto-delivery

- [ ] **Step 1:** Grep product copy for “auto-send” claims that imply delivery
- [ ] **Step 2:** Soften to “auto-send when available” or remove from store-facing strings
- [ ] **Step 3:** Keep Vault toggle as-is (feature flag for later engine)

---

### Task 3: Play / App Store production (Track 2 — mostly human)

**Files:**
- Reference: `docs-site/content/shipaton-blueprint.md`
- Possibly bump: `android/app/build.gradle` versionCode / versionName

**Interfaces:**
- Produces: Public store URL(s) available in US

- [ ] **Step 1:** Create Play products matching RC packages; link Play service account in RevenueCat
- [ ] **Step 2:** Fill `revenueCatConfig.androidApiKey` (`goog_…`) for release builds (keep Test Store for debug if desired)
- [ ] **Step 3:** Privacy Policy + Terms URLs; Data Safety form
- [ ] **Step 4:** Upload production AAB; release to production (US)
- [ ] **Step 5:** Add Play App Signing SHA-1 to Firebase
- [ ] **Step 6:** (Optional iOS) App Store Connect + `appl_…` key + smoke purchase

---

### Task 4: Devpost submission (Track 3 — mostly human)

**Files:**
- Reference: `docs-site/content/shipaton-blueprint.md` section D

- [ ] **Step 1:** Register on Devpost Shipaton 2026
- [ ] **Step 2:** Record ≤2 min demo: create → share → Account purchase → Pro unlock
- [ ] **Step 3:** Export 1024×1024 icon + 1179×2556 screenshot (no device frame)
- [ ] **Step 4:** Fill RC Project ID + judge promo/trial steps
- [ ] **Step 5:** Submit before **25 Sep** if possible (buffer); final by **30 Sep 11:45pm PDT**

---

### Task 5: Update living docs after verify

**Files:**
- Modify: `docs-site/content/shipaton-blueprint.md`
- Modify: `docs-site/content/billing-blueprint.md`
- Modify: `docs-site/content/blueprint.md`
- Modify: `ARCHITECTURE.md` / `AGENTS.md` current focus

- [ ] **Step 1:** Check off completed engineering items
- [ ] **Step 2:** Set current focus to remaining store/Devpost items
- [ ] **Step 3:** Note auto-send engine as post-Shipaton Phase 4

---

## Out of scope (do not implement in this plan)

- `scheduled_sends` Functions + Cloud Scheduler
- Review window screens
- WhatsApp Business / SMS / email queue
