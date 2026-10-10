# Production readiness and security audit

Audited 2026-10-08 against the live setup (Android live, iOS pending).
**No application code was changed for this audit.**

Evidence labels: **Verified live** (probed the real service, status codes only, no user data read) ·
**Verified code** (read in the repo) · **Needs console** (can only be checked in a dashboard).

---

## P0 — fix before promoting anything else

### 1. Cloud Functions have never been deployed (Verified live)

`firebase functions:list` → *"Cloud Functions API has not been used in project occasio-app-dev before or it is
disabled."* Every `…cloudfunctions.net/api/*` URL returns Google's 404 in every region. The Firestore location is set
but no default Storage bucket exists (404), which together point to the project still being on the free **Spark** plan.

Everything that lives in `functions/` is therefore **dead in production**:

| Feature | What users experience now |
|---|---|
| **Delete account** (`DELETE /v1/account`) | Tapping it fails with "Could not delete your account right now". Google Play and Apple both **require working in-app deletion**; this is a live Play policy gap and an iOS rejection risk. |
| **Auto-send** (cron + sweep + email + push) | Never runs. This is the headline paid feature in the store copy, the Vault toggle and the new onboarding. |
| Review-window **approve / cancel** | Endpoints do not exist. |
| **Billing sync** (`users.subscriptionTier`) | Never written. The app UI still unlocks Pro from RevenueCat locally, but anything that trusts the server tier (auto-send) cannot work. |
| **Single-wish credit** (`consume-credit`) | The call fails silently (`useCreateShareLink` only logs a warning), so a purchased credit is **never spent and can be reused**: a free-card leak. |
| Firebase **Storage** | Not provisioned. The app falls back to inline base64 photos in Firestore (`env.useBase64Media = true`). |

**Fix:** upgrade to Blaze with a budget alert, enable the APIs, deploy `functions/`, set the secrets
(`REVENUECAT_SECRET_KEY`, `OCCASIO_RC_WEBHOOK_AUTH`, `OCCASIO_CRON_SECRET`, `RESEND_API_KEY`, `OCCASIO_EMAIL_FROM`,
`OCCASIO_AUTOSEND_DISPATCH=true`), point the RevenueCat webhook at `/v1/billing/webhook`, then re-run the probes in
"How to re-verify" below. Until then, **don't advertise or sell auto-send** (see "Copy that is currently untrue").

### 2. Deploy the current Firestore rules (Needs console)

The History fix (`allow get … resource == null`) is only local. If it is not deployed, History silently saves nothing,
which also means cards are never linked to the account (see P1-3). `npm run firestore:deploy` works on Spark.

### 3. iOS build does not link on this machine (Verified)

`ld: Undefined symbols … facebook::react::Sealable / ShadowNode …` from RNDateTimePicker, Gesture Handler, SVG and
Google Sign-In. It fails identically with the widget changes removed. Root cause unknown. iOS cannot ship until a clean
archive builds. Try a fresh `pod install` (delete `ios/Pods` and the lock), a clean DerivedData, and check
RNDateTimePicker (recently added) against New Architecture codegen.

### Copy that is currently untrue until #1 is done

* Onboarding step 4/5 and the Pro compare table: "Auto-send, with your approval — Included".
* Store listing drafts (`store-assets/listing/*`): the "Never miss a date" section.
* Privacy policy: "Deletion starts immediately" (in-app), "card media … deleted after expiry", "Firebase … crash
  reporting" (there is no crash reporting in the app).

---

## P1 — high

| # | Finding | Evidence | Fix |
|---|---|---|---|
| 1 | **Card ownership is client-claimed and cards are `userId: null`.** `user_creations/{id}` is written by the app; the rule only requires the card to exist, not that the caller made it. Anyone signed in who learns a `creationId` (an unguessable id, so exploiting needs a leak) could claim a card, then edit or delete it via the API. | Verified code: `firestore.rules`, `createCreation` | Send the ID token on create, set `userId` and write the history row **server-side**, then make `user_creations` create `false` for clients. |
| 2 | The same gap breaks other promises: the paywall says **365-day links** (server always sets 30), the free **1 card/month** limit is enforced only in the app, and **account deletion cannot find cards never linked** to the user. | Verified code | Same fix as #1, then derive TTL and quota from the server-known tier. |
| 3 | **Expired cards are never deleted.** No function or TTL removes them, so photos and messages stay forever, contradicting the privacy policy (DPDP/GDPR retention). | Verified code (only `autosendDaily`/`autosendSweep` exist) | Add a Firestore **TTL policy on `creations.expiresAt`** (console) and/or a nightly purge. |
| 4 | **No crash reporting; analytics is a console.log stub.** You are blind to crashes and cannot measure the funnel. | Verified code: no Crashlytics/Sentry/Analytics dependency | Add Firebase Crashlytics + Analytics (or Sentry), and fix the policy wording either way. |
| 5 | **Anonymous card creation + public hosting + no moderation.** `POST /api/v1/creations` needs no sign-in; the only limit is an in-memory counter per serverless instance (easy to bypass); `mediaUrls` is **not validated** unless photos are inline, so a card can embed any external image URL (tracking pixels, offensive or phishing imagery on your domain); there is **no report/abuse link**. | Verified code: `creationsServer.ts`, `rateLimit.ts` | Require an ID token (anonymous auth is fine) + **Firebase App Check**; accept only `data:image/*` or your own bucket; add "Report this card"; use a shared rate limiter (Upstash/Vercel KV or WAF). |
| 6 | **Dev and production are the same Firebase project** (`occasio-app-dev`). Every debug build and test hits live data. | Verified code: `google-services.json`, `firebaseAdmin.ts` | Create a separate prod project; keep this one for dev. |
| 7 | **Android release hygiene:** `enableProguardInReleaseBuilds = false` (not minified); legacy `READ/WRITE_EXTERNAL_STORAGE` in the merged manifest although the code comment says none is needed; the RevenueCat **Test Store key** ships in the bundle; release signing silently falls back to the debug keystore if `keystore.properties` is missing. | Verified code | Enable R8 + shrinkResources (test!), remove the permissions with `tools:node="remove"`, delete `testApiKey` from release, fail the build instead of falling back to debug signing. |

---

## P2 — medium

| # | Finding | Fix |
|---|---|---|
| 1 | **Website sends only HSTS.** No CSP, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`. | Add `headers()` in `next.config.ts` (start CSP in report-only; the card page loads Google Fonts, WebGL and images). |
| 2 | **Card pages are indexable.** `/c/*` has no `noindex`, and `robots.txt` says `Allow: /`. Links shared publicly can end up in search results with the recipient's name in the title. | `robots: { index: false, follow: false }` in the card metadata and `X-Robots-Tag`. |
| 3 | **Dependencies.** Functions: `proxy-addr` (critical, not reachable: no `req.ip`) and `@grpc/grpc-js`; docs-site: `sharp`, `postcss`, `@grpc/grpc-js`. Root has 59 findings, almost all React Native / Jest / Metro **dev tooling that is not in the shipped app**. | `npm audit fix` (non-breaking) in `functions/` and `docs-site/`; add `npm audit --omit=dev --audit-level=high` to CI for those two; revisit the RN stack on the next upgrade. |
| 4 | **Auto-send email:** no unsubscribe/footer, no mention of **Resend** in the privacy policy (it receives recipients' email addresses), SPF/DKIM/DMARC not verifiable here. | Add a footer + `List-Unsubscribe`, name Resend in the policy, publish DNS records. |
| 5 | **Auth hardening:** email addresses are **not verified** at sign-up; `console.log('[auth] Password reset email requested for', email)` is not `__DEV__`-guarded (PII in release logs). | Enforce/encourage verification, guard the logs, review Firebase Auth settings (enumeration protection, password policy, authorized domains) in the console. |
| 6 | **Store privacy declarations are inconsistent.** `PrivacyInfo.xcprivacy` lists no collected data types while the app collects email, user content, purchases and a push token. | Make the privacy manifest, App Store labels and Play Data Safety agree. |
| 7 | **Firebase API keys** in `google-services.json` / `GoogleService-Info.plist` are public by design but should be **restricted** (Android package + SHA-1, iOS bundle id, API list). | Console → Credentials. |
| 8 | **CI is thin** (`tsc` + Jest + docs-site build). No lint, no functions build, no audit. | Add `eslint`, `functions` build, `npm audit`. |
| 9 | **Secrets and keys on one laptop.** The upload keystore and the Firebase Admin key sit in `IMP/` (outside git, good). A lost upload key is painful. | Back up to a password manager/vault; rotate the Admin key if it was ever shared; confirm Play App Signing is on. |
| 10 | **Passcode** is 4 digits. The server lockout (5 fails → 15 min) is real protection, but it also lets anyone with the link lock the legitimate recipient out, and the draft passcode is kept in local AsyncStorage. | Acceptable as a light lock; document it, don't market it as security. |
| 11 | **Free-tier Vault cap** (1 person) is app-only; the rules accept any `relationships` write. Auto-send is still blocked server-side for free users (once functions exist). | Optional rule/size validation. |

---

## What is already good

* **Firestore denies anonymous access** to all five collections (live probe: 403 each).
* **No secrets in git history**; keystores and `.env*` are ignored; the Admin key is outside the repo.
* Android release manifest: **not debuggable, `allowBackup=false`, no cleartext traffic**; iOS ATS blocks arbitrary loads.
* Website: HTTPS + HSTS preload; `/docs` is gated (anonymous → redirected); legal pages are live.
* API: bearer tokens are verified with Firebase Admin; ownership checks on edit/delete; **passcodes are scrypt-hashed**
  with server-side lockout; slugs use `crypto.randomBytes`; card content is rendered through React (no
  `dangerouslySetInnerHTML` on user content); email HTML escapes the name and URL.
* Functions code: the cron endpoint and billing webhook use **constant-time secret comparison** and refuse to run when
  the secret is missing; billing tier fields are not client-writable.
* **Sign in with Apple** is present alongside Google sign-in (Apple 4.8).
* Account deletion **code** is thorough, it just is not deployed.

---

## Needs a dashboard check (cannot be seen from the repo)

* Firestore deployed rules match `firestore.rules` (History fix).
* A **TTL policy** exists on `creations.expiresAt`.
* Vercel env: `FIREBASE_SERVICE_ACCOUNT_JSON` set; **`OCCASIO_ALLOW_DEV_CREATE`, `OCCASIO_DEV_RELAXED_QUOTA` unset**.
* Functions env (after deploy): **`OCCASIO_AUTOSEND_ALLOW_FREE` and `OCCASIO_MOCK_DELIVERY` unset**.
* RevenueCat: products attached to `occasio_pro`, webhook pointed at the deployed function, production keys (`goog_`/`appl_`) verified in a release build.
* Play Console: Data Safety, content rating, target API (36 is fine), App Signing, account-deletion URL.
* App Store Connect: privacy labels, subscription group, review notes, the `aps-environment`/push entitlement in the
  signed IPA. (Correction: the `development` value in `Occasio.entitlements` is replaced with `production` when
  signing with a distribution profile; verify it in the exported IPA instead of editing the file.)

## How to re-verify the live backend (no credentials needed)

```bash
# Functions deployed? (404 = not deployed; 401/503 = deployed and rejecting)
curl -s -o /dev/null -w "%{http_code}\n" -X POST https://asia-south1-occasio-app-dev.cloudfunctions.net/api/v1/billing/sync
# Firestore closed to anonymous users? (expect 403)
curl -s -o /dev/null -w "%{http_code}\n" "https://firestore.googleapis.com/v1/projects/occasio-app-dev/databases/(default)/documents/users?pageSize=1"
# Webhook secret set? (503 = not set, 401 = set)
curl -s -o /dev/null -w "%{http_code}\n" -X POST https://asia-south1-occasio-app-dev.cloudfunctions.net/api/v1/billing/webhook
```

## Suggested order

1. Blaze + deploy functions + secrets + RevenueCat webhook, then re-probe. (P0-1)
2. Deploy Firestore rules. (P0-2)
3. Hide auto-send claims until step 1 is verified end to end. (P0 copy)
4. Fix the iOS link failure. (P0-3)
5. Crashlytics + analytics, TTL policy, security headers + noindex. (P1-3/4, P2-1/2)
6. Server-side create (auth + App Check + ownership + tier-aware TTL/quota). (P1-1/2/5)
7. Separate prod project. (P1-6)
8. Android hardening, dependency fixes, email footer, store declarations. (rest)
