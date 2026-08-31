---
title: Environment strategy
description: dev / staging / prod Firebase projects, secrets, and client config.
phase: Phase 3 — Technical
status: Draft v1
updated: 2026-08-31
---

## Projects

| Env | Firebase project | Purpose |
|---|---|---|
| **dev** | `occasio-dev` | Local RN + emulators |
| **staging** | `occasio-staging` | Internal TestFlight / Play internal |
| **prod** | `occasio-prod` | Store release |

## Client config (RN)

```
.env.development    # gitignored — dev keys only
.env.staging        # CI / internal builds
.env.production     # store builds
```

**Never commit:** API keys with write access, R2 secrets, WhatsApp tokens, RevenueCat secret.

**Safe in client:** Firebase web API key (restricted by app id), public share base URL.

## Secrets (server only)

| Secret | Where |
|---|---|
| R2 access keys | Cloud Functions env / Secret Manager |
| WhatsApp / SMS / email | Functions only |
| RevenueCat webhook secret | Functions only |

## Local dev

1. `firebase use dev`
2. Optional: Auth + Firestore emulators
3. RN: `ENVFILE=.env.development npm run android`

## Branch → env mapping

| Branch | Deploy target |
|---|---|
| `main` | prod (manual promote) |
| `develop` | staging |
| feature branches | dev / emulators |

See [NFR targets](/docs/nfr) for performance gates per env.
