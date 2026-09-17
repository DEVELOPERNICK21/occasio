---
title: Feature blueprint — Billing (RevenueCat)
description: Phase 4 / Shipaton — Play + App Store subscriptions via RevenueCat, wired to Vault caps and create quota.
phase: Phase 4 — Build
status: In progress
updated: 2026-09-13
---

## Goal

Ship **real in-app purchases** through RevenueCat so Occasio qualifies for [Shipaton 2026](https://revenuecat-shipaton-2026.devpost.com/) and paid tiers unlock Vault caps, link TTL, and (later) auto-send.

**Principle:** UI never imports RevenueCat SDK — only `features/billing/data/`.

## Products (from PRD)

| Tier | Entitlement ID (suggested) | Store products | Unlocks |
|---|---|---|---|
| **Free** | *(none)* | — | 1 card/month, 1 Vault person, 30-day links, no auto-send |
| **Personal** | `personal` | `occasio_personal_monthly`, `occasio_personal_yearly` | Unlimited cards, 5 people, 365-day links, auto-send toggle |
| **Family** | `family` | `occasio_family_monthly`, `occasio_family_yearly` | Same + 15 people, priority templates (later) |
| **One-off unlock** *(optional v1)* | `single_card` | consumable | 1 premium card without subscription |

Create products in **Google Play Console** and **App Store Connect** first, then mirror in RevenueCat.

## RevenueCat dashboard setup

- [ ] Create RevenueCat project; note **Project ID** (required for Devpost)
- [ ] Connect **Google Play** app (`com.occasio`) — service account JSON in RevenueCat
- [ ] Connect **App Store** app — App Store Connect API key in RevenueCat
- [ ] Define entitlements: `personal`, `family` (and `single_card` if one-off ships)
- [ ] Map offerings / packages (monthly + annual per tier)
- [ ] Enable **Customer Center** (restore + manage subscription)
- [ ] Create **judge promo / sandbox test** instructions for Shipaton (free trial or promo code)

## Client layers

```
src/features/billing/
  domain/
    entitlements.ts      ← map RC entitlement → SubscriptionTier
    subscriptionRules.ts ← what each tier unlocks (mirror vault/tierLimits + quota)
  data/
    revenueCatClient.ts  ← purchases-react-native SDK wrapper (only file with RC import)
    billingErrors.ts
  application/
    BillingProvider.tsx  ← init RC, sync tier to context
    useSubscription.ts   ← tier, isPro, purchase, restore
    usePaywall.ts        ← show offerings, handle purchase result
  ui/
    PaywallScreen.tsx    ← or wire existing PaywallModal
    PlanPicker.tsx
```

## Wire points (existing code)

| Surface | Today | After billing |
|---|---|---|
| `create/ui/PaywallModal.tsx` | "See plans" closes modal | Opens paywall / purchase flow |
| `create/domain/quota.ts` | hardcoded free tier | reads tier from `useSubscription` |
| `vault/application/useSavePerson.ts` | `tier = 'free'` default | tier from billing hook |
| `vault/application/useToggleAutoSend.ts` | `canEnableAutoSend('free')` | live tier |
| `auth/ui/AccountHomeScreen.tsx` | "billing coming soon" | plan name, manage, restore |
| `auth/domain/accountProfile.ts` | placeholder tier copy | real entitlement labels |

## Server (optional v1, recommended before production)

| Item | File | Status |
|---|---|---|
| `POST /v1/webhooks/revenuecat` | `functions/src/index.ts` | Not implemented |
| Mirror `subscriptionTier` on `users/{uid}` | `src/features/billing/data/userTierMirror.ts` | **Client mirror live** — `BillingProvider` writes tier after RC refresh/purchase |
| Webhook auth header | env / Functions secret | Not configured |

**Auto-send cron gate:** Functions reads `users/{uid}.subscriptionTier` (`personal` \| `family` required; missing → `free` → send `failed` / `lastError: 'tier'`). The client mirror is sufficient for dev and early rollout; add the RevenueCat webhook before relying on tier in production without the app open. Emulator dev: `OCCASIO_AUTOSEND_ALLOW_FREE=true` bypasses the paid gate.

## Dependencies

```sh
npm install react-native-purchases
# iOS: pod install
# Android: Play Billing Library pulled in by SDK
```

Add to `.env.example` (never commit real keys):

```
REVENUECAT_ANDROID_API_KEY=
REVENUECAT_IOS_API_KEY=
```

Public SDK keys only in client — webhook secret in Functions only (`env-strategy.md`).

## Analytics

| Event | When |
|---|---|
| `paywall_shown` | Quota hit or upgrade CTA |
| `purchase_started` | User taps plan |
| `subscribe_success` | RC purchase completed |
| `subscribe_failed` | Purchase error |
| `restore_success` | Restore finds entitlement |

## Acceptance criteria

- [ ] RevenueCat SDK initialized on app launch (signed-in user UID as `appUserID`)
- [ ] At least **one** purchasable product works on **Android** (Shipaton minimum)
- [ ] PaywallModal → real purchase or plan picker (not dismiss-only)
- [ ] `useSubscription().tier` drives Vault person cap + auto-send gate
- [ ] Create quota respects paid tier (unlimited vs 1/month)
- [ ] Restore purchases on Account screen
- [ ] Guest create still works without billing
- [ ] Domain tests: entitlement → tier mapping
- [ ] iOS purchase path tested (required for App Store Shipaton entry)
- [ ] Judge can unlock premium (trial or promo code documented for Devpost)

## Code map (target)

```
src/features/billing/     ← new feature folder
src/features/create/ui/components/PaywallModal.tsx  ← wire purchase
src/features/vault/domain/tierLimits.ts             ← already tier-aware
functions/src/index.ts    ← webhook handler
```

## Shipaton dependency

Billing is **blocking** for Shipaton eligibility — app must use RevenueCat SDK for at least one IAP. See [Shipaton blueprint](/docs/shipaton-blueprint).

## Next after billing

Device-verify sandbox purchase (Shipaton). **Auto-send engine** is built — cron + review + mock dispatch; E2E verification and real providers remain (see [Vault blueprint](/docs/vault-blueprint)).
