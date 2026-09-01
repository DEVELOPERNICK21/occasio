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

### API without Blaze (current path)

Spark uses **Vercel serverless API** on `docs-site` — not direct Firestore from the mobile app:

| Route | Purpose |
|---|---|
| `POST /api/v1/creations` | Create card (mobile) |
| `GET /api/v1/cards/:slug` | Card metadata (optional; recipient page uses Admin SDK directly) |

Firestore rules: **`creations` deny all client read/write** — only Admin SDK (Vercel) or Cloud Functions (Blaze later).

1. **Mock API in dev** (`useMockApi: true`) — offline UI only
2. **Spark + Vercel API** — `useMockApi: false`, mobile POSTs to `shareBaseUrl/api/v1/creations`
3. **Blaze + Storage** — `useBase64Media: false`, enable Storage, `npm run spark:deploy`
4. **Functions emulator** — `npm run functions:serve`, `useFunctionsEmulator: true`

Deploy locked rules: `npm run firestore:deploy`.

### GCP setup (same project — do NOT create a new Firebase project)

Use existing project **`occasio-app-dev`**.

1. [Firebase Console](https://console.firebase.google.com/project/occasio-app-dev/settings/serviceaccounts/adminsdk) → **Service accounts** → **Generate new private key** (JSON)
2. **Vercel** → Project → Settings → Environment Variables:
   - `FIREBASE_SERVICE_ACCOUNT_JSON` = paste the **entire JSON** (mark Sensitive)
   - `OCCASIO_SHARE_BASE` = `https://occasio-greetings.vercel.app`
3. **Redeploy** docs-site (env vars apply only to new deployments)
4. From repo root: `npm run firestore:deploy` (locks `creations` to server-only)

**Do not commit** the service account JSON. Rotate the key if it was ever pasted in chat or committed.

**Optional (later):** restrict a separate web API key in [GCP Credentials](https://console.cloud.google.com/apis/credentials?project=occasio-app-dev) — not required when using Admin SDK only.

**Rate limiting / abuse:** enable [Vercel Firewall](https://vercel.com/docs/security/firewall) on `/api/v1/creations` or upgrade to Blaze + Cloud Functions + App Check.

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
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Vercel env (docs-site API + recipient pages) |
| R2 access keys | Cloud Functions env / Secret Manager |
| WhatsApp / SMS / email | Functions only |
| RevenueCat webhook secret | Functions only |

**Never in client or git:** service account JSON, R2 secrets, webhook secrets.

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
