---
title: Shipaton 2026 — submission checklist
description: RevenueCat Shipaton eligibility, Occasio-specific engineering + Devpost deliverables. Deadline 30 Sep 2026.
phase: Phase 4.5 — Ship
status: In progress
updated: 2026-09-02
---

## What Shipaton requires

Official rules: [Devpost — RevenueCat Shipaton 2026](https://revenuecat-shipaton-2026.devpost.com/) · [How to submit](https://www.revenuecat.com/blog/engineering/how-to-submit-your-app-for-shipaton)

| Requirement | Occasio note |
|---|---|
| **New app** first public release **1 Aug – 30 Sep 2026** | Ship 1.0 to Play (and/or App Store) inside window |
| **RevenueCat SDK** powers ≥1 IAP or RC Ads | Build `features/billing/` — see [Billing blueprint](/docs/billing-blueprint) |
| **Published** on App Store, Google Play, or Galaxy Store | Play internal test ≠ public — need **production** listing available in **US** |
| **Devpost submission** by **30 Sep 2026, 11:45pm PDT** | Register now; submit early, revise until deadline |
| **Demo video** ≤2 min, YouTube/Vimeo, public | Show create → share → paywall purchase on device |
| **1024×1024 icon** | `npm run icons:generate` or design export |
| **1179×2556 screenshot**, no device frame | From shipped Create or Vault screen |
| **RevenueCat Project ID** on Devpost form | From RC dashboard after project create |
| **Judge premium access** | Free trial and/or promo code — document in submission |

**Next Gen Award (students):** video + public repo instead of store listing — different path; see official rules if applicable.

---

## Occasio engineering checklist

### A. RevenueCat + billing (must-have)

- [x] RevenueCat project + Android + iOS apps linked *(confirm in dashboard)*
- [x] `react-native-purchases` in `features/billing/data/`
- [ ] At least one subscription or one-off product live in Play Console
- [x] PaywallModal / RC Paywall UI wired to purchase (not placeholder)
- [x] Entitlement → `SubscriptionTier` drives Vault caps + create quota
- [x] Restore purchases on Account
- [x] `subscribe_success` analytics event
- [ ] Sandbox / internal test account verified end-to-end

### B. Store release (must-have)

- [ ] Play Console **production** track (US available) — not internal-only
- [ ] App Store Connect listing (if entering iOS category)
- [ ] `versionCode` / build number bumped per release
- [ ] Play **App signing SHA-1** in Firebase (auth works on Play installs)
- [ ] Privacy Policy + Terms URLs live (landing site ✅)
- [ ] Data Safety (Play) + App Privacy (Apple) forms match real data collection
- [ ] Store listing copy matches **shipped** features only (no auto-send claims until live)

### C. Core product polish (should-have for judges)

- [x] Guest create → share link flow
- [x] Recipient web `/c/[slug]`
- [x] Auth (Google + email)
- [x] Vault + History
- [ ] iOS sign-in device tested
- [ ] Paywall + paid tier visibly unlocks something judges can verify
- [ ] Landing page beta CTA + contact email

### D. Submission assets (Devpost)

- [ ] Register on [Devpost](https://revenuecat-shipaton-2026.devpost.com/register)
- [ ] Project name + tagline + English description
- [ ] Public store URL(s)
- [ ] Demo video recorded (≤2 min essential footage)
- [ ] 1024×1024 icon uploaded
- [ ] 1179×2556 screenshot(s) without frame
- [ ] RevenueCat Project ID filled in
- [ ] Judge instructions: promo code or trial steps to unlock premium
- [ ] Category selections + any extra fields answered
- [ ] Team / solo entrant details correct
- [ ] Final **Submit** clicked in Devpost (draft ≠ eligible)

### E. Nice-to-have (not required for eligibility)

- [ ] Auto-send engine (post-Shipaton OK if not claimed in listing)
- [ ] Blaze + R2 presign upload
- [ ] Crashlytics / Sentry
- [ ] Fastlane CI/CD

---

## Suggested timeline (Sep 2026)

| Week | Focus |
|---|---|
| **Early Sep** | RevenueCat + Play products + wire paywall |
| **Mid Sep** | Production Play release (US), judge trial/promo |
| **Mid Sep** | Record demo video + screenshots |
| **Before 25 Sep** | Devpost draft submitted (buffer for review fixes) |
| **30 Sep** | Final submit before 11:45pm PDT |

Ship **1.0 early in the window** — store review can take days ([RevenueCat guide](https://www.revenuecat.com/blog/engineering/how-to-submit-your-app-for-shipaton)).

---

## Architecture reminder

```
PaywallModal (create/ui)
  → usePaywall (billing/application)
    → revenueCatClient (billing/data)  ← only layer with RC SDK
      → domain entitlements → vault tierLimits + create quota
```

No RevenueCat imports in `ui/` or other features' `data/`.

---

## Links

- [Billing blueprint](/docs/billing-blueprint)
- [Blueprint tracker](/docs/blueprint) — Phase 4.5 section
- [API contracts — RC webhook](/docs/api-contracts)
- Play internal test (beta testers): share link + email on landing
