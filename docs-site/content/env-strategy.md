---
title: Environment strategy
description: dev / staging / prod Firebase projects, secrets, and client config.
phase: Phase 3 — Technical
status: Draft v1
updated: 2026-08-31
---

## Firebase plan: Spark (pre-scale)

Stay on **Spark** until traction. Upgrade to **Blaze** only when you need Cloud Functions in production, scheduled auto-send, or heavy egress.

| Capability | Spark (now) | Blaze (later) |
|---|---|---|
| Firestore | Yes | Yes |
| Firebase Auth | Yes | Yes |
| **Firebase Storage** (images) | No (requires Blaze since Feb 2026) | Yes |
| Cloud Functions (prod deploy) | No — use emulators locally or Vercel API routes | Yes |
| Cloud Scheduler (auto-send) | No | Yes |
| FCM push | Yes | Yes |

### Media (do not use base64 long-term)

Firestore documents are capped at **~1 MB**. Three photos as base64 will break quickly and make every card read expensive.

**Spark interim (pre-Blaze):** one compressed photo as a `data:image/...` URL in `mediaUrls` (`useBase64Media: true` in `env.ts`). Max ~750 KB. Recipient web renders it directly.

**After Blaze:** set `useBase64Media: false`, enable Firebase Storage, run `npm run spark:deploy`. Store `storagePath` / HTTPS URLs only — same field shape, no schema migration needed.

**At scale:** migrate blobs to Cloudflare R2 + presigned URLs (TRD) when egress or cost matters.

### API without Blaze

Until Blaze, pick one:

1. **Mock API in dev** (`useMockApi: true`) — default in `__DEV__` for fast UI iteration
2. **Spark + base64** — `useMockApi: false`, `useBase64Media: true` (default): one photo inline in Firestore; deploy rules with `npm run firestore:deploy`
3. **Blaze + Storage** — `useBase64Media: false`, enable Storage, `npm run spark:deploy`
4. **Functions emulator locally** — `npm run functions:serve`, `useFunctionsEmulator: true`
5. **Vercel serverless routes** on `docs-site` — alternative API without Blaze

Deploy Firestore rules only (Spark base64): `npm run firestore:deploy`.

Cloud Functions in `functions/` are ready for when you upgrade; not required on Spark day one.

## Projects

| Env | Firebase project | Purpose |
|---|---|---|
| **dev** | `occasio-app-dev` | Local RN + emulators |
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
