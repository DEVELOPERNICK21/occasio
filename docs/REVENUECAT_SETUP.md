# RevenueCat setup — Occasio

Official install: [React Native](https://www.revenuecat.com/docs/getting-started/installation/reactnative) · [Paywalls](https://www.revenuecat.com/docs/tools/paywalls) · [Customer Center](https://www.revenuecat.com/docs/tools/customer-center)

## Packages (installed)

```sh
npm install --save react-native-purchases react-native-purchases-ui
cd ios && pod install && cd ..
```

## Dashboard checklist

### 1. Entitlement

| Identifier | Purpose |
|---|---|
| `occasio_pro` | Unlocks Personal-tier limits (unlimited cards, 5 Vault people, auto-send gate) |

### 2. Products / packages (current offering)

| Package ID | Type |
|---|---|
| `lifetime` | Non-consumable / lifetime |
| `yearly` | Annual subscription |
| `monthly` | Monthly subscription |

Attach each product to entitlement **`occasio_pro`**. Set this offering as **Current**.

### 3. Paywall + Customer Center

1. RevenueCat → **Paywalls** → design template → attach to current offering  
2. RevenueCat → **Customer Center** → enable (used from Account → Manage subscription)

### 4. API keys

App reads from `src/shared/config/revenueCat.ts`:

- **Test Store** key (`test_…`) — already set for sandbox / Shipaton testing  
- Production: fill `androidApiKey` (`goog_…`) and `iosApiKey` (`appl_…`)

Public SDK keys only — never webhook secrets in the app.

## App architecture (Occasio layers)

```
ui (Preview / Account)
  → usePaywall / useSubscription (application)
    → revenueCatClient + revenueCatUi (data)  ← only place that imports RC SDKs
      → domain: occasio_pro → SubscriptionTier 'personal'
```

| Action | Hook / API |
|---|---|
| Check Pro | `useSubscription().hasPro` |
| Present paywall | `presentPaywall()` / `presentPaywallIfNeeded` for `occasio_pro` |
| Restore | `restore()` |
| Manage plan | `openCustomerCenter()` (paid) or paywall (free) |

## Test (Shipaton Track 1)

Debug builds set `env.devRelaxedQuota` so **Generate** skips the free-tier paywall.
Use Account to verify purchases:

1. Rebuild native app after installing UI package (`pod install` on iOS)
2. Sign in → **Account → See Occasio Pro** → purchase a Test Store product
3. Badge should read **OCCASIO PRO**; Vault person cap + auto-send arm unlock
4. **Account → Manage subscription** → Customer Center (when Pro)
5. **Account → Restore purchases**
6. (Release / non-dev) Create until free quota hits → RC Paywall on Generate

## Production note

Replace Test Store key with platform App Store / Play keys before production release. Internal test / Shipaton can use Test Store while products sync.

Full sprint plan: [`docs/superpowers/plans/2026-09-12-shipaton-sprint.md`](./superpowers/plans/2026-09-12-shipaton-sprint.md)  
Design: [`docs/superpowers/specs/2026-09-12-shipaton-sprint-design.md`](./superpowers/specs/2026-09-12-shipaton-sprint-design.md)
